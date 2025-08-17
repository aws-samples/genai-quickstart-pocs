CREATE TABLE IF NOT EXISTS EquipmentTypes (
    EquipTypeID int NOT NULL,
    EquipTypeName varchar(100) NOT NULL,
    CreatedBy varchar(50) DEFAULT 'AWS',
    CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy varchar(50) DEFAULT 'AWS',
    UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT equipmenttypes_pkey PRIMARY KEY (EquipTypeID)
);