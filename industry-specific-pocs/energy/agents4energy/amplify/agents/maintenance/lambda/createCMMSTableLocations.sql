CREATE TABLE IF NOT EXISTS Locations (
                LocationID int NOT NULL
                , LocTypeID varchar(3) NOT NULL REFERENCES LocationTypes(LocTypeID)
                , LocName varchar(100) NOT NULL
                , BusinessUnit varchar(3) REFERENCES businessunits(buid)
                , Facility int REFERENCES locations(locationid)
                , Section varchar(20)
                , WorkCenter varchar(20)
                , LocMgrID varchar(20)
                , Latitude float
                , Longitude float
                , Address1 varchar(100)
                , Address2 varchar(100)
                , City varchar(100)
                , State varchar(100)
                , Zip varchar(20)
                , Country varchar(100)
                , Phone varchar(20)
                , Fax varchar(20)
                , Email varchar(100)
                , CreatedBy varchar(50) DEFAULT 'AWS'
                , CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP
                , UpdatedBy varchar(50) DEFAULT 'AWS'
                , UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP
                , CONSTRAINT locations_pkey PRIMARY KEY (locationid)
                );