CREATE TABLE IF NOT EXISTS LocationTypes (
  LocTypeID varchar(3) NOT NULL,
  LocTypeName varchar(100) NOT NULL,
  CreatedBy varchar(50) DEFAULT 'AWS',
  CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy varchar(50) DEFAULT 'AWS',
  UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT locationtypes_pkey PRIMARY KEY (LocTypeID)
);