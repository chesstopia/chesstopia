/*
 * checkDocs — deterministische Doku-Prüfung (Stufe 1).
 *
 * Bewusst eigenständig und NICHT an `check` gehängt: Ein toter Doku-Link darf
 * den Java-Build nicht brechen. Verbindlich wird der Task über CI.
 *
 * Geprüft wird ausschließlich, was ohne Urteilsvermögen entscheidbar ist.
 * Alles Semantische — beschreibt das Dokument noch das, was der Code tut? —
 * ist Sache der Drift-Agenten, nicht dieses Skripts.
 */

val docsRoot = file("docs")

// _templates/ enthält Formulare mit {{platzhaltern}}, keine Dokumente.
// local/ ist gitignored. .obsidian/ ist Werkzeugkonfiguration.
val excludedDirs = listOf("local", "_templates", ".obsidian")

data class Doc(
    val file: File,
    val path: String,
    val text: String,
    val frontmatter: Map<String, List<String>>
)

fun parseFrontmatter(text: String): Map<String, List<String>>? {
    val lines = text.lines()
    if (lines.firstOrNull()?.trim() != "---") return null
    val end = lines.drop(1).indexOfFirst { it.trim() == "---" }
    if (end < 0) return null

    val result = linkedMapOf<String, MutableList<String>>()
    var current: String? = null
    for (line in lines.subList(1, end + 1)) {
        val listItem = Regex("""^\s+-\s+(.*)$""").find(line)
        if (listItem != null && current != null) {
            result.getValue(current!!).add(listItem.groupValues[1].trim().trim('"', '\''))
            continue
        }
        val entry = Regex("""^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$""").find(line) ?: continue
        val (key, rawValue) = entry.destructured
        current = key
        val value = rawValue.trim()
        result[key] = when {
            value.isEmpty() || value == "[]" -> mutableListOf()
            else -> mutableListOf(value.trim('"', '\''))
        }
    }
    return result
}

fun collectDocs(): List<Doc> {
    val docs = docsRoot.walkTopDown()
        .onEnter { it.name !in excludedDirs }
        .filter { it.isFile && it.extension == "md" }
        .toMutableList()
    docs.add(file("CLAUDE.md"))
    return docs.map { f ->
        val text = f.readText()
        Doc(f, f.relativeTo(rootDir).invariantSeparatorsPath, text, parseFrontmatter(text) ?: emptyMap())
    }.sortedBy { it.path }
}

tasks.register("checkDocs") {
    group = "verification"
    description = "Prüft Dokumentation und Kontraktgrenzen: ADR-Nummern, tote Links, Frontmatter, verifies-Drift, Controller-Mappings, Versionskatalog, Klartext-Secrets"

    doLast {
        val errors = mutableListOf<String>()
        val warnings = mutableListOf<String>()
        val docs = collectDocs()

        // ── Regel 1: doppelte ADR-Nummer ──────────────────────────────────────
        // Der reale Fall: zwei Dokumente trugen gleichzeitig die Nummer 0008.
        docs.filter { it.path.startsWith("docs/adr/") && it.file.name != "index.md" }
            .groupBy { it.file.name.take(4) }
            .filterValues { it.size > 1 }
            .forEach { (number, group) ->
                errors += "ADR-Nummer $number ist doppelt vergeben: ${group.joinToString { it.path }}"
            }

        // ── Regel 2: toter relativer Link ─────────────────────────────────────
        val linkPattern = Regex("""\[[^\]]*\]\(([^)\s]+)\)""")
        val outgoing = mutableMapOf<String, MutableSet<String>>()
        docs.forEach { doc ->
            val targets = outgoing.getOrPut(doc.path) { mutableSetOf() }
            linkPattern.findAll(doc.text).forEach { match ->
                val raw = match.groupValues[1]
                if (raw.startsWith("http") || raw.startsWith("#") || raw.startsWith("mailto:")) return@forEach
                val relative = raw.substringBefore('#')
                if (relative.isEmpty()) return@forEach
                val target = doc.file.parentFile.resolve(relative).normalize()
                if (!target.exists()) {
                    errors += "${doc.path}: toter Link → $raw"
                } else if (target.extension == "md") {
                    targets.add(target.relativeTo(rootDir).invariantSeparatorsPath)
                }
            }
        }

        // ── Regel 3: Frontmatter ──────────────────────────────────────────────
        // CLAUDE.md liegt außerhalb des Vaults und trägt bewusst keines.
        val statusByType = mapOf(
            "adr" to setOf("accepted", "superseded", "partially-superseded", "draft"),
            "note" to setOf("current", "draft", "deprecated"),
            "runbook" to setOf("current", "draft", "deprecated"),
            "module" to setOf("active", "deprecated")
        )
        docs.filter { it.path.startsWith("docs/") }.forEach { doc ->
            val type = doc.frontmatter["type"]?.firstOrNull()
            val status = doc.frontmatter["status"]?.firstOrNull()
            when {
                type == null -> errors += "${doc.path}: Frontmatter ohne 'type'"
                type !in statusByType -> errors += "${doc.path}: unbekannter type '$type'"
                status == null -> errors += "${doc.path}: Frontmatter ohne 'status'"
                status.lowercase() !in statusByType.getValue(type) ->
                    errors += "${doc.path}: status '$status' ist für type '$type' nicht zulässig " +
                        "(erlaubt: ${statusByType.getValue(type).joinToString(" · ")})"
            }
        }

        // ── Regel 4: ADR-Pflichtabschnitte ────────────────────────────────────
        val requiredSections = listOf("## Status", "## Context", "## Decision", "## Consequences")
        docs.filter { it.path.startsWith("docs/adr/") && it.file.name != "index.md" }.forEach { doc ->
            val missing = requiredSections.filterNot { doc.text.contains(it) }
            if (missing.isNotEmpty()) {
                errors += "${doc.path}: fehlende Pflichtabschnitte ${missing.joinToString()}"
            }
        }

        // ── Regel 5: Drift in verifies ────────────────────────────────────────
        // 'pfad :: erwarteter wert' — links die Quelle, rechts der Wert, der
        // darin vorkommen muss. Wer eine Zahl in ein Dokument schreibt,
        // schreibt dazu, woher sie stammt.
        var verifiedCount = 0
        docs.forEach { doc ->
            doc.frontmatter["verifies"].orEmpty().forEach { entry ->
                val parts = entry.split("::").map { it.trim() }
                if (parts.size != 2 || parts.any { it.isEmpty() }) {
                    errors += "${doc.path}: verifies-Eintrag nicht im Format 'pfad :: wert': $entry"
                    return@forEach
                }
                val (source, expected) = parts
                if (source.contains('#')) {
                    errors += "${doc.path}: Struktur-Selektoren sind nicht implementiert, " +
                        "nur Substring-Suche: $entry"
                    return@forEach
                }
                val sourceFile = rootDir.resolve(source)
                when {
                    !sourceFile.isFile -> errors += "${doc.path}: verifies zeigt auf fehlende Datei $source"
                    !sourceFile.readText().contains(expected) ->
                        errors += "${doc.path}: '$expected' steht nicht mehr in $source"
                    else -> verifiedCount++
                }
            }
            if (doc.frontmatter.containsKey("drift-accepted")) {
                warnings += "${doc.path}: 'drift-accepted' wird noch nicht geprüft — " +
                    "Eingangsregel und Obergrenze fehlen"
            }
        }

        // ── Regel 6: Erreichbarkeit von docs/index.md (Warnung) ───────────────
        // Ein Dokument, auf das keine Kette von Links führt, ist unsichtbar.
        // Warnung statt Fehler: Ein frisch angelegtes Dokument darf das kurz sein.
        val entry = "docs/index.md"
        val reachable = mutableSetOf(entry)
        val queue = ArrayDeque(listOf(entry))
        while (queue.isNotEmpty()) {
            outgoing[queue.removeFirst()].orEmpty().forEach { next ->
                if (reachable.add(next)) queue.add(next)
            }
        }
        docs.filterNot { it.path in reachable }.forEach {
            warnings += "${it.path}: von $entry aus nicht erreichbar"
        }

        // ── Regel 7: Mapping-Annotation im Controller (Warnung) ───────────────
        // Verbot 2: Ein Endpunkt entsteht nie im Controller. Wer das generierte
        // Interface implementiert, erbt Pfad und Methode daraus und trägt selbst
        // keine Mapping-Annotation. Eine eigene ist der übliche Weg, den
        // Kontrakt unbemerkt zu umgehen.
        //
        // Bewusst Regex, kein Java-Parser: Die Annotation steht immer am
        // Zeilenanfang; ein Parser wäre hundertmal teurer als der Befund.
        //
        // Fehler, nicht Warnung: Die Regel lief zunächst als Warnung, weil es
        // genau einen ausgewiesenen Verstoß gab — /api/v1/counter. Seit der
        // Endpunkt im Kontrakt steht, ist der Bestand sauber; jeder neue Treffer
        // ist eine echte Umgehung von Verbot 2 und darf den Build brechen.
        val mappingAnnotation = Regex("""^\s*@(RequestMapping|(Get|Post|Put|Patch|Delete)Mapping)\b""", RegexOption.MULTILINE)
        file("chesstopia-backend/src/main").walkTopDown()
            .filter { it.isFile && it.extension == "java" }
            .forEach { f ->
                val text = f.readText()
                if (!text.contains("@RestController")) return@forEach
                val found = mappingAnnotation.findAll(text).map { it.groupValues[1] }.toSet()
                if (found.isNotEmpty()) {
                    errors += "${f.relativeTo(rootDir).invariantSeparatorsPath}: " +
                        "@RestController mit eigener Mapping-Annotation (${found.joinToString()}) — " +
                        "der Pfad gehört in docs/api/openapi.yaml"
                }
            }

        // ── Regel 8: toter Eintrag im Versionskatalog ─────────────────────────
        // Ein Katalogeintrag, den kein Build-Skript referenziert, sieht aus wie
        // die wirksame Angabe und ist keine. Wer die Version dort ändert,
        // ändert nichts.
        //
        // chess-engine ist ein eigener Build mit eigenem Katalog und bleibt
        // deshalb außen vor.
        val catalog = file("gradle/libs.versions.toml")
        if (catalog.isFile) {
            val buildScripts = listOf(
                file("build.gradle.kts"),
                file("settings.gradle.kts"),
                file("chesstopia-backend/build.gradle.kts")
            ).filter { it.isFile }.joinToString("\n") { it.readText() }

            var section: String? = null
            catalog.readLines().forEach { line ->
                val trimmed = line.trim()
                Regex("""^\[(\w+)]$""").find(trimmed)?.let { section = it.groupValues[1]; return@forEach }
                if (section != "libraries" && section != "plugins") return@forEach
                val alias = Regex("""^([A-Za-z][A-Za-z0-9_-]*)\s*=""").find(trimmed)?.groupValues?.get(1)
                    ?: return@forEach
                val accessor = "libs." + (if (section == "plugins") "plugins." else "") +
                    alias.replace('-', '.')
                if (!buildScripts.contains(accessor)) {
                    errors += "gradle/libs.versions.toml: '$alias' wird von keinem Build-Skript " +
                        "referenziert ($accessor)"
                }
            }
        }

        // ── Regel 9: generierter Code unter Versionskontrolle ─────────────────
        // Verbot 1. Beide Verzeichnisse sind gitignored und entstehen bei jedem
        // Build neu — was hier eincheckt, ist beim nächsten buildAll weg und
        // erzeugt bis dahin falsches Vertrauen.
        //
        // Heute kein Befund. Die Regel ist eine Sperre, kein Fund: Sie kostet
        // einen git-Aufruf und verhindert einen Fehler, der sich nur schwer
        // wieder einfangen lässt.
        val tracked = providers.exec {
            commandLine("git", "ls-files", "openapi-client/src", "chesstopia-backend/build")
        }.standardOutput.asText.get().trim()
        if (tracked.isNotEmpty()) {
            errors += "generierter Code ist versioniert: " +
                tracked.lines().joinToString().take(300)
        }

        // ── Regel 10: Klartext-Secret in Produktionskonfiguration ─────────────
        // Verbot 6. Nicht die Datei ist verboten, sondern der Wert:
        // `application-prod.yml` und `docker-compose.prod.yml` gehören ins Repo,
        // ihre Zugangsdaten kommen ausschließlich aus der Umgebung.
        //
        // Geprüft wird nur Produktionskonfiguration — alles unter `infra/` und
        // `.github/workflows/` sowie jede Datei, deren Name "prod" enthält. Die
        // Entwicklungskonfiguration bleibt außen vor: Ihre Zugangsdaten zeigen
        // auf localhost und stehen bewusst im Klartext.
        //
        // Ansible-Vault-Dateien sind ausgenommen; ihr Inhalt ist verschlüsselt.
        val secretKey = Regex(
            """^\s*-?\s*["']?([A-Za-z0-9_.-]*""" +
                """(?:password|passwd|secret|token|api[_-]?key|private[_-]?key|credential)""" +
                """[A-Za-z0-9_.-]*)["']?\s*[:=]\s*(.*)""",
            RegexOption.IGNORE_CASE
        )
        val configExtensions = setOf("yml", "yaml", "properties", "env", "j2")
        rootDir.walkTopDown()
            .onEnter { it.name !in setOf(".git", ".gradle", "build", "node_modules", "dist") }
            .filter { it.isFile && it.extension in configExtensions }
            .filter { f ->
                val rel = f.relativeTo(rootDir).invariantSeparatorsPath
                rel.startsWith("infra/") || rel.startsWith(".github/workflows/") ||
                    f.name.contains("prod")
            }
            .forEach { f ->
                val rel = f.relativeTo(rootDir).invariantSeparatorsPath
                val lines = f.readLines()
                if (lines.firstOrNull()?.startsWith("\$ANSIBLE_VAULT") == true) return@forEach
                lines.forEachIndexed { index, line ->
                    val match = secretKey.find(line) ?: return@forEachIndexed
                    val (key, rawValue) = match.destructured
                    val value = rawValue.substringBefore(" #").trim().trim('"', '\'')
                    val fromEnvironment = value.isEmpty() ||
                        value.startsWith("\${") ||   // ${POSTGRES_PASSWORD}, ${{ secrets.X }}
                        value.startsWith("{{") ||    // Ansible/Jinja
                        value.startsWith("!vault") ||
                        value == "|" || value == ">"
                    if (!fromEnvironment) {
                        errors += "$rel:${index + 1}: '$key' trägt einen Literalwert — " +
                            "Produktionswerte kommen aus der Umgebung (Verbot 6)"
                    }
                }
            }

        // ── Ausgabe ───────────────────────────────────────────────────────────
        warnings.forEach { logger.warn("checkDocs WARNUNG  $it") }
        logger.lifecycle(
            "checkDocs: ${docs.size} Dokumente, $verifiedCount belegte verifies-Einträge, " +
                "${warnings.size} Warnungen, ${errors.size} Fehler"
        )
        if (errors.isNotEmpty()) {
            throw GradleException(
                "checkDocs: ${errors.size} Fehler\n" + errors.joinToString("\n") { "  - $it" }
            )
        }
    }
}
