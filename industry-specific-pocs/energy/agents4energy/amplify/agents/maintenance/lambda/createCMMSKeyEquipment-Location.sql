DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.table_constraints
        WHERE  table_schema = 'public'  -- Adjust schema name if necessary
        AND   table_name   = 'equipment'
        AND   constraint_name = 'installlocationid_fk'
    ) THEN
        ALTER TABLE equipment
        ADD CONSTRAINT installlocationid_fk FOREIGN KEY (installlocationid)
        REFERENCES locations (locationid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID;
    END IF;
END \$\$;