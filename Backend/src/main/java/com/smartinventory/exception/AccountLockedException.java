package com.smartinventory.exception;

public class AccountLockedException extends RuntimeException {
    public AccountLockedException() {
        super("Account is locked due to multiple failed login attempts");
    }
}
