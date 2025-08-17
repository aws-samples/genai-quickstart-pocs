CREATE TABLE IF NOT EXISTS Maintenance (
                MaintID int NOT NULL
                , MaintTypeID varchar(3) NOT NULL REFERENCES mainttypes(mainttypeid)
                , EquipID varchar(20)
                , MaintName varchar(100) NOT NULL
                , MaintLongDesc varchar(2048)
                , WorkOrderID varchar(20)
                , EffortHours int
                , EstCost numeric(10,2)
                , DowntimeReq boolean
                , TechnicianID varchar(50)
                , ResponsibleID varchar(50)
                , RequiresPermit boolean
                , StatusID varchar(3) NOT NULL REFERENCES statustypes(statusid)
                , PlannedDateStart date
                , PlannedDateEnd date
                , ActualDateStart date
                , ActualDateEnd date
                , CreatedBy varchar(50) DEFAULT 'AWS'
                , CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP
                , UpdatedBy varchar(50) DEFAULT 'AWS'
                , UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP
                , CONSTRAINT maintenance_pkey PRIMARY KEY (maintid)
                );