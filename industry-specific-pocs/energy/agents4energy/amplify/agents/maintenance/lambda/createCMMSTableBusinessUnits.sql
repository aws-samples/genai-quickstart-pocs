CREATE TABLE IF NOT EXISTS BusinessUnits (
  BUID varchar(3) NOT NULL,
  BUName varchar(100) NOT NULL,
  CreatedBy varchar(50) DEFAULT 'AWS',
  CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy varchar(50) DEFAULT 'AWS',
  UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT businessunits_pkey PRIMARY KEY (BUID)
);