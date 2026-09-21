package io.chesstopia.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    /**
     * Dieses Design hat keine einzige legitime Client-zu-Server-STOMP-Nachricht (kein
     * {@code @MessageMapping} existiert, {@code /app} ist tot). Ohne diesen Interceptor
     * würde der Simple Broker jedes {@code SEND}-Frame eines anonymen Clients ungeprüft an
     * {@code /topic/*}-Abonnenten weiterreichen — ein Dritter könnte damit eine gefälschte
     * {@code GameResponse} an alle Mitspieler broadcasten. Da es nichts Legitimes zu senden
     * gibt, ist ein pauschales Verbot ausreichend; Authentifizierung ist dafür nicht nötig.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                var accessor = StompHeaderAccessor.wrap(message);
                if (StompCommand.SEND.equals(accessor.getCommand())) {
                    throw new MessagingException("Clients senden nicht");
                }
                return message;
            }
        });
    }
}
