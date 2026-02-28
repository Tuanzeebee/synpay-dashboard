package com.companyx.synpay_dashboard.config;

import java.util.HashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import com.zaxxer.hikari.HikariDataSource;

import jakarta.persistence.EntityManagerFactory;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.companyx.synpay_dashboard.repository.hr",
        entityManagerFactoryRef = "hrEntityManagerFactory",
        transactionManagerRef = "hrTransactionManager"
)
public class HrDataSourceConfig {

    @Primary
    @Bean
    @ConfigurationProperties("spring.datasource.hr")
    public DataSource hrDataSource() {
        return new HikariDataSource();
    }

    @Primary
    @Bean
    public LocalContainerEntityManagerFactoryBean hrEntityManagerFactory() {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(hrDataSource());
        em.setPackagesToScan("com.companyx.synpay_dashboard.entity.hr");

        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        vendorAdapter.setShowSql(true);
        em.setJpaVendorAdapter(vendorAdapter);

        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "none");
        properties.put("hibernate.format_sql", "true");
        em.setJpaPropertyMap(properties);

        return em;
    }

    @Primary
    @Bean
    public PlatformTransactionManager hrTransactionManager(EntityManagerFactory hrEntityManagerFactory) {
        return new JpaTransactionManager(hrEntityManagerFactory);
    }
}
