CREATE TABLE IF NOT EXISTS MaintTypes (
  MaintTypeID varchar(3) NOT NULL,
  MaintTypeName varchar(100) NOT NULL,
  CreatedBy varchar(50) DEFAULT 'AWS',
  CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy varchar(50) DEFAULT 'AWS',
  UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT mainttypes_pkey PRIMARY KEY (MaintTypeID)
);