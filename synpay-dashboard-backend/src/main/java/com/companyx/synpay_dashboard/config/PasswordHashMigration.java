package com.companyx.synpay_dashboard.config;

import java.util.List;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.entity.auth.Account;
import com.companyx.synpay_dashboard.repository.auth.AccountRepository;

/**
 * One-time startup migration that converts any plain-text passwords
 * in the {@code account} table into BCrypt hashes.
 * <p>
 * This is safe to run repeatedly: it only touches rows whose
 * {@code password_hash} does not already look like a BCrypt string
 * (i.e. does not start with {@code $2a$}, {@code $2b$}, or {@code $2y$}).
 */
@Component
public class PasswordHashMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PasswordHashMigration.class);

    /** Regex that matches a valid BCrypt hash prefix. */
    private static final Pattern BCRYPT_PATTERN = Pattern.compile("^\\$2[aby]\\$\\d{2}\\$");

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordHashMigration(AccountRepository accountRepository,
                                 PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(transactionManager = "authTransactionManager")
    public void run(ApplicationArguments args) {
        List<Account> accounts = accountRepository.findAll();
        int migrated = 0;

        for (Account account : accounts) {
            String currentHash = account.getPasswordHash();
            if (currentHash == null || currentHash.isBlank()) {
                log.warn("Account id={} has a blank password_hash – skipping", account.getAccountId());
                continue;
            }

            if (BCRYPT_PATTERN.matcher(currentHash).find()) {
                // Already BCrypt – nothing to do
                continue;
            }

            // currentHash is plain text → hash it with BCrypt
            String bcryptHash = passwordEncoder.encode(currentHash);
            account.setPasswordHash(bcryptHash);
            accountRepository.save(account);
            migrated++;

            log.info("Migrated account id={} ({}) to BCrypt", account.getAccountId(), account.getEmail());
        }

        if (migrated > 0) {
            log.info("Password migration complete: {} account(s) updated to BCrypt", migrated);
        } else {
            log.info("Password migration: all accounts already use BCrypt – nothing to do");
        }
    }
}
