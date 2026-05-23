package com.smartinventory.exception;

public class TokenExpiredException extends RuntimeException {
    public TokenExpiredException() {
        super("Token has expired or is invalid");
    }
}
