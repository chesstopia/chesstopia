package io.chesstopia.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
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
}
