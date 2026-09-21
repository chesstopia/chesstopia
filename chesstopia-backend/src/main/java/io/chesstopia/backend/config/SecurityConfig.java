package io.chesstopia.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth ->
                // Bewusster Zustand: alle Requests erlaubt bis JWT-Authentifizierung implementiert ist.
                // Nicht vergessen, sondern explizit konfiguriert — kein unsichtbarer Default.
                auth.anyRequest().permitAll()
            );

        // TODO: JWT-Filter hier einhängen (vor UsernamePasswordAuthenticationFilter)

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Nur der Vite-Devserver. In Produktion routet Caddy /api/* same-origin und
        // entfernt den Origin-Header, dort greift die Liste gar nicht erst — und
        // seit ADR-0028 faehrt auch Ebene 4 hinter Caddy, nicht mehr gegen einen
        // eigenen Preview-Port. Wer einen weiteren Origin braucht, traegt ihn hier
        // ein; eine Liste, die nichts mehr prueft, gehoert nicht stehen gelassen.
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
