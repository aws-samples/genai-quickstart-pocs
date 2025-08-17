CREATE TABLE IF NOT EXISTS Equipment (
                EquipID varchar(20) NOT NULL
                , EquipTypeID int NOT NULL
                , EquipName varchar(100) NOT NULL
                , EquipLongDesc varchar(2048)
                , Manufacturer varchar(50)
                , Model varchar(50)
                , ManfYear int
                , WebLink varchar(250)
                , SerialNum varchar(50)
                , EquipWeight decimal(10,2)
                , InstallLocationID int
                , lat decimal(10,6)
                , lon decimal(10,6)
                , SafetyCritical boolean NOT NULL
                , StatusID varchar(3) NOT NULL
                , ServiceDateStart date
                , ServiceDateEnd date
                , CreatedBy varchar(50) DEFAULT 'AWS'
                , CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP
                , UpdatedBy varchar(50) DEFAULT 'AWS'
                , UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP
                , CONSTRAINT equipment_pkey PRIMARY KEY (equipid)
                );