CREATE TABLE IF NOT EXISTS StatusTypes (
  StatusID varchar(3) NOT NULL,
  StatusName varchar(100) NOT NULL,
  CreatedBy varchar(50) DEFAULT 'AWS',
  CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy varchar(50) DEFAULT 'AWS',
  UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT statustypes_pkey PRIMARY KEY (StatusID)
);