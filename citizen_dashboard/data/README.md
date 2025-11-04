# Citizen Dashboard Extension Data

This directory contains initial data for the citizen dashboard extension.

## Data Files

### services_data.json

Contains public services available to citizens.

**Entity**: Service

**Fields**:
- service_id: Unique service identifier (e.g., "srv-001")
- name: Service name
- description: Service description
- provider: Service provider organization
- status: Service status (Active, Pending, Expired)
- due_date: ISO format timestamp for service deadline
- link: URL link to the service
- user: Reference to User entity ID
- metadata: Additional metadata as JSON string

### tax_records_data.json

Contains tax records for citizens.

**Entity**: TaxRecord

**Fields**:
- tax_id: Unique tax record identifier (e.g., "tax-001")
- tax_type: Type of tax (Income Tax, Property Tax, Vehicle Tax, etc.)
- description: Tax description
- period: Tax period (e.g., "2024", "2024 Q1")
- amount: Tax amount (float)
- due_date: ISO format timestamp for payment deadline
- status: Payment status (Pending, Paid, Overdue)
- user: Reference to User entity ID
- metadata: Additional metadata as JSON string

## Loading Data

These data files are automatically loaded during realm deployment via the automatic extension data loading feature.

When you run `realms create --deploy`, the system will:
1. Discover all `extensions/*/data/*.json` files
2. Import them automatically into the database

## Notes

- The `user` field references existing User entity IDs in your realm
- Default sample data uses user IDs "3" and "4" (user_001 and user_002)
- Services and tax records are filtered by user_id when queried
- Adjust user references and data based on your specific realm requirements
