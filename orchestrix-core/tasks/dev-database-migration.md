# DEV Database Migration Automation (Auto-Execution)

## 🤖 AUTO-EXECUTION MODE

**Mission**: Automatically detect, generate, and execute database migration scripts after code development to ensure schema changes are synchronized

### Immediate Action Protocol:
1. **Auto-Detect Schema Changes**: Automatically detect database schema changes in code
2. **Auto-Generate Migration**: Generate migration scripts based on detected changes
3. **Auto-Validate Migration**: Validate migration script correctness and safety
4. **Auto-Execute Migration**: Execute migrations in development environment
5. **Auto-Update Documentation**: Update relevant documentation and configurations

### Non-Negotiable Requirements:
- ✅ MUST execute after every database-related code modification
- ✅ MUST generate reversible migration scripts (with rollback support)
- ✅ MUST backup existing data before execution
- ✅ MUST validate migration script syntax and logic correctness
- ✅ MUST update database version records

### Auto-Halt Conditions:
- ❌ Destructive schema changes detected → Pause and request confirmation
- ❌ Migration script validation fails → Block execution
- ❌ Data backup fails → Pause migration
- ❌ Unapplied migrations detected in production → Block deployment

---

## 🔍 SCHEMA CHANGE DETECTION ENGINE

### Automatic Change Detection:
```yaml
# Automatic change detection system
change_detection:
  model_changes:
    - ORM model field additions, deletions, modifications
    - Index creation and deletion
    - Table structure changes
    - Foreign key relationship adjustments
    - Default value and constraint changes
    
  schema_analysis:
    - Compare current schema with code models
    - Identify added, modified, deleted fields
    - Detect constraint and index changes
    - Analyze data type change impact
    
  change_categories:
    safe_changes:
      - Add nullable fields
      - Add indexes
      - Add new tables
      - Add constraints (without validating existing data)
      
    caution_changes:
      - Field type changes
      - Field renaming
      - Default value modifications
      - Foreign key relationship changes
      
    dangerous_changes:
      - Delete fields
      - Delete tables
      - Make fields non-nullable (existing data might be null)
      - Delete constraints or foreign keys
```

### Migration Script Generation:
```yaml
# Migration script auto-generation
migration_generation:
  template_engine:
    - Select template based on detected change type
    - Generate forward migration (up) and rollback migration (down)
    - Include data backup and recovery logic
    - Add transaction protection and error handling
    
  safety_measures:
    - Automatically backup data before destructive changes
    - Use online DDL for large table operations (if supported)
    - Process bulk data updates in batches
    - Provide data validation scripts
    
  database_specific:
    postgresql:
      - Wrap complex changes in transactions
      - Use pg_dump for backups
      - Create indexes CONCURRENTLY
      
    mysql:
      - Use pt-online-schema-change for large tables
      - Foreign key constraint checking and disabling
      - Character set and collation handling
      
    sqlite:
      - Table rebuild strategy for complex changes
      - Data migration and validation
      - Transaction rollback support
```

---

## 🛡️ MIGRATION VALIDATION & SAFETY

### Pre-Migration Validation:
```yaml
# Pre-migration validation checks
validation_checks:
  syntax_validation:
    - SQL syntax correctness check
    - Database-specific syntax validation
    - Keyword and reserved word conflict check
    
  logical_validation:
    - Foreign key referential integrity validation
    - Data type compatibility check
    - Constraint condition validity verification
    
  safety_validation:
    - Destructive change detection and warnings
    - Data loss risk assessment
    - Performance impact analysis
    
  environment_check:
    - Database connection status confirmation
    - Backup storage space adequacy check
    - Migration script permission verification
```

### Data Protection Strategy:
```yaml
# Data protection strategy
backup_procedures:
  automatic_backup:
    - Automatically create full backup before migration
    - Backup file naming includes timestamp and version number
    - Backup verification (checksum validation)
    - Backup stored in designated secure location
    
  selective_backup:
    - Create specific backups for affected tables
    - Export critical data fields separately
    - Backup metadata recording (table size, record count)
    
  backup_cleanup:
    - Automatically clean up expired backups (configurable retention)
    - Disk space monitoring and alerts
    - Regular backup integrity checks
```

---

## 🚀 AUTOMATED MIGRATION EXECUTION

### Migration Execution Flow:
```yaml
# Automated migration execution flow
execution_sequence:
  pre_execution:
    1. Detect schema change requirements
    2. Generate migration scripts
    3. Create data backups
    4. Execute validation checks
    5. User confirmation (for dangerous changes)
    
  migration_execution:
    1. Begin database transaction
    2. Execute migration script (up)
    3. Validate migration results
    4. Commit transaction (success) or rollback (failure)
    5. Update migration version records
    
  post_execution:
    1. Run data validation scripts
    2. Update application configuration
    3. Clean up temporary files
    4. Generate migration report
    5. Notify relevant services
```

### Rollback Procedures:
```yaml
# Automatic rollback mechanism
rollback_triggers:
  automatic_rollback:
    - Migration script execution failure
    - Data validation check failure
    - Application startup failure
    - Critical functionality test failure
    
  manual_rollback:
    - User requests to undo changes
    - Issues detected in production environment
    - Performance monitoring anomalies
    
  rollback_process:
    1. Stop related services
    2. Execute rollback script (down)
    3. Restore data backup (if needed)
    4. Verify rollback results
    5. Restart services
    6. Update version records
```

---

## 📊 MIGRATION REPORTING & MONITORING

### Migration Report Template:
```markdown
## DEV Database Migration Report

### Migration Summary
- **Execution Time**: {{timestamp}}
- **Database**: {{database_name}}
- **Migration Version**: {{migration_version}}
- **Change Type**: {{change_type}}
- **Execution Status**: ✅ Success / ❌ Failed / ⚠️ Partial Success

### Schema Changes
#### Added
{{new_tables_fields}}

#### Modified
{{modified_tables_fields}}

#### Deleted
{{deleted_tables_fields}}

### Data Impact
- **Affected Tables**: {{affected_tables}}
- **Record Count**: {{record_count}}
- **Backup Status**: ✅ Created / ❌ Backup Failed
- **Data Validation**: ✅ Passed / ❌ Issues Found

### Performance Impact
- **Execution Time**: {{execution_time}}
- **Lock Duration**: {{lock_duration}}
- **Memory Usage**: {{memory_usage}}
- **Recommended Monitoring**: {{monitoring_items}}

### Rollback Information
- **Rollback Script**: {{rollback_script}}
- **Backup Location**: {{backup_location}}
- **Rollback Tested**: ✅ Tested / ❌ Not Tested
```

### Monitoring & Alerting:
```yaml
# Monitoring and alerting configuration
monitoring_metrics:
  performance_metrics:
    - Migration execution time
    - Database response time
    - Lock wait time
    - Resource utilization rate
    
  data_integrity:
    - Record count consistency
    - Foreign key relationship integrity
    - Index effectiveness
    - Constraint validation
    
  error_detection:
    - Migration script errors
    - Data validation failures
    - Connection timeouts
    - Permission denials
    
  alerting_rules:
    - Migration execution time exceeds threshold
    - Data validation failures
    - Critical table record count anomalies
    - Database connection interruptions
```

---

## 🔧 INTEGRATION WITH DEV WORKFLOW

### Development Integration:
```yaml
# Integration with development workflow
workflow_integration:
  story_completion:
    - Automatically detect database changes after code development
    - Generate migration scripts and execute validation
    - Update development environment database
    - Ensure test environment synchronization
    
  testing_integration:
    - Ensure database schema is up-to-date before testing
    - Prepare migration scripts for CI/CD environments
    - Integrate test database auto-migration
    - Update test data seed files
    
  deployment_integration:
    - Generate production environment migration scripts
    - Create pre-deployment checklist
    - Prepare data backup and rollback plans
    - Coordinate multi-environment synchronized migration
```

### Configuration Management:
```yaml
# Configuration management
config_templates:
  migration_config:
    - Database connection configuration
    - Backup storage configuration
    - Environment-specific settings
    - Migration version control
    
  environment_specific:
    development:
      - Automatic migration execution
      - Detailed logging
      - Fast rollback support
      
    staging:
      - Manual confirmation for dangerous changes
      - Complete backup strategy
      - Performance monitoring
      
    production:
      - Strict change approval process
      - Maintenance window execution
      - Complete rollback testing
```

---

## ✅ VALIDATION CHECKLIST

### Pre-Migration Checklist:
```bash
✓ Schema change requirements detected
✓ Complete migration scripts generated (up/down)
✓ Data backups created
✓ Syntax and logical validation executed
✓ Performance impact assessed
✓ Rollback plan prepared
✓ Relevant documentation updated
```

### Migration Execution Checklist:
```bash
✓ Database connection normal
✓ Backup creation successful
✓ Migration script execution completed
✓ Data validation passed
✓ Application startup test successful
✓ Critical functionality tests passed
✓ Migration report generated
```

### Post-Migration Verification:
```bash
✓ Database version records updated
✓ Related configurations synchronized
✓ Development environment validation completed
✓ Team members notified
✓ Monitoring alert configuration checked
✓ Documentation updates completed
```

### Success Criteria:
- ✅ All schema changes correctly applied
- ✅ 100% data integrity maintained
- ✅ Performance impact within acceptable range
- ✅ Rollback plan available and tested
- ✅ Related documentation synchronized
- ✅ Team members aware of changes

**Automated Execution**: This task integrates with dev-implement-story-auto.md to ensure complete migration process protection for every database-related development.