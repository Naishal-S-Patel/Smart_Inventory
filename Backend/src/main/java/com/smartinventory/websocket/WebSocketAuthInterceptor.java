package com.smartinventory.websocket;

import com.smartinventory.security.JwtService;
import com.smartinventory.security.UserPrincipal;
import com.smartinventory.security.UserDetailsServiceImpl;
import io.jsonwebtoken.JwtException;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;

    public WebSocketAuthInterceptor(JwtService jwtService, UserDetailsServiceImpl userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String token = resolveToken(accessor);
        if (token == null) {
            throw new MessagingException("Missing or invalid Authorization header");
        }

        try {
            String username = jwtService.extractSubject(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (!jwtService.validateToken(token, userDetails)) {
                throw new MessagingException("Token validation failed");
            }
            accessor.setUser(userDetails instanceof UserPrincipal up ? (java.security.Principal) up : null);
        } catch (JwtException ex) {
            throw new MessagingException("Invalid or expired JWT: " + ex.getMessage(), ex);
        }

        return message;
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        // Try native header first (stomp Authorization)
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        // Fallback: token native header
        String tokenHeader = accessor.getFirstNativeHeader("token");
        if (tokenHeader != null && !tokenHeader.isBlank()) {
            return tokenHeader;
        }
        return null;
    }
}
