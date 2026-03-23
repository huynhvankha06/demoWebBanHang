#!/bin/bash
set -e

/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -i /var/opt/mssql/order.sql
