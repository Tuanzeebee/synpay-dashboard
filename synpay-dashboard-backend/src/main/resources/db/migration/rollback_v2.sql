-- =============================================================================
-- ROLLBACK V2: Remove DepartmentCode, Description, Status from Departments
--              Remove PositionCode, Description, Status from Positions
--
-- Run this MANUALLY on your SQL Server HUMAN database to revert the V2
-- migration that was applied in the previous session.
--
-- Usage:  sqlcmd -S localhost -d HUMAN -U sa -P <password> -i rollback_v2.sql
-- =============================================================================

-- ---- Departments: drop index first ----
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UQ_Departments_DepartmentCode'
      AND object_id = OBJECT_ID('dbo.Departments')
)
BEGIN
    DROP INDEX UQ_Departments_DepartmentCode ON [dbo].[Departments];
END
GO

-- Drop default constraint on Status
DECLARE @deptStatusConstraint NVARCHAR(200);
SELECT @deptStatusConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
WHERE c.name = 'Status' AND dc.parent_object_id = OBJECT_ID('dbo.Departments');

IF @deptStatusConstraint IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[Departments] DROP CONSTRAINT [' + @deptStatusConstraint + ']');
END
GO

IF COL_LENGTH('dbo.Departments', 'DepartmentCode') IS NOT NULL
    ALTER TABLE [dbo].[Departments] DROP COLUMN [DepartmentCode];
GO

IF COL_LENGTH('dbo.Departments', 'Description') IS NOT NULL
    ALTER TABLE [dbo].[Departments] DROP COLUMN [Description];
GO

IF COL_LENGTH('dbo.Departments', 'Status') IS NOT NULL
    ALTER TABLE [dbo].[Departments] DROP COLUMN [Status];
GO

-- ---- Positions: drop index first ----
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UQ_Positions_PositionCode'
      AND object_id = OBJECT_ID('dbo.Positions')
)
BEGIN
    DROP INDEX UQ_Positions_PositionCode ON [dbo].[Positions];
END
GO

-- Drop default constraint on Status
DECLARE @posStatusConstraint NVARCHAR(200);
SELECT @posStatusConstraint = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
WHERE c.name = 'Status' AND dc.parent_object_id = OBJECT_ID('dbo.Positions');

IF @posStatusConstraint IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[Positions] DROP CONSTRAINT [' + @posStatusConstraint + ']');
END
GO

IF COL_LENGTH('dbo.Positions', 'PositionCode') IS NOT NULL
    ALTER TABLE [dbo].[Positions] DROP COLUMN [PositionCode];
GO

IF COL_LENGTH('dbo.Positions', 'Description') IS NOT NULL
    ALTER TABLE [dbo].[Positions] DROP COLUMN [Description];
GO

IF COL_LENGTH('dbo.Positions', 'Status') IS NOT NULL
    ALTER TABLE [dbo].[Positions] DROP COLUMN [Status];
GO

PRINT 'V2 rollback complete. Departments and Positions restored to original schema.';
GO
