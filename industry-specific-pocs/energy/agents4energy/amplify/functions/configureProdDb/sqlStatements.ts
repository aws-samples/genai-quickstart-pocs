export const sqlStatements = [/* sql */`

-- Create the Business Units Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businessunits') THEN
    CREATE TABLE BusinessUnits (
        BUID varchar(3) NOT NULL
        , BUName varchar(100) NOT NULL
        , CreatedBy varchar(50) DEFAULT 'AWS'
        , CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP
        , UpdatedBy varchar(50) DEFAULT 'AWS'
        , UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP
        , CONSTRAINT businessunits_pkey PRIMARY KEY (buid)
        );
    END IF;
END $$;
`,
/* sql */`
-- Create the Location Types Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locationtypes') THEN

    CREATE TABLE LocationTypes (
        LocTypeID varchar(3) NOT NULL
        , LocTypeName varchar(100) NOT NULL
        , CreatedBy varchar(50) DEFAULT 'AWS'
        , CreatedDate timestamp DEFAULT CURRENT_TIMESTAMP
        , UpdatedBy varchar(50) DEFAULT 'AWS'
        , UpdatedDate timestamp DEFAULT CURRENT_TIMESTAMP
        , CONSTRAINT locationtypes_pkey PRIMARY KEY (loctypeid)
        );

    END IF;
END $$;
`,
/* sql */`
-- Create the Locations table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN

    CREATE TABLE Locations (
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

    END IF;
END $$;
`,
/* sql */`
-- Check if the schema 'production' already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'production') THEN
        CREATE SCHEMA production;
    END IF;
END $$;
`,
// /* sql */`
// -- Create the daily production table if it doesn't already exist
// DO $$
// BEGIN
//     IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'production' AND table_name = 'daily') THEN
//         CREATE TABLE production.daily (
//             wellid INT,
//             proddate DATE,
//             oil NUMERIC(12,2),
//             gas NUMERIC(12,2),
//             water NUMERIC(12,2),
//             tubpres NUMERIC(10,2),
//             caspres NUMERIC(10,2)
//         );

//         --===== SAMPLE WELL DATA (63858 rows)
//         INSERT INTO production.daily (wellid, proddate, oil, gas, water, tubpres, caspres)
//         SELECT
//             wellid,
//             proddate,
//             CAST(initial_oil * POWER(0.995, DATE_PART('day', proddate - first_prod)) AS NUMERIC(12,2)) AS oil,
//             CAST(initial_gas * POWER(0.996, DATE_PART('day', proddate - first_prod)) AS NUMERIC(12,2)) AS gas,
//             CAST(initial_water * POWER(0.997, DATE_PART('day', proddate - first_prod)) * (1 + 0.25 + 0.0005 * DATE_PART('day', proddate - first_prod)) AS NUMERIC(12,2)) AS water,
//             CAST(GREATEST(initial_tubpres - 5 * DATE_PART('day', proddate - first_prod), 100) AS NUMERIC(10,2)) AS tubpres,
//             CAST(GREATEST(initial_caspres - 6 * DATE_PART('day', proddate - first_prod), 100) AS NUMERIC(10,2)) AS caspres
//         FROM (
//             VALUES
//                 (946, '2017-07-01'::DATE, 750, 3500, 250, 2800, 3200),
//                 (947, '2017-09-28'::DATE, 680, 3400, 225, 2775, 3175),
//                 (948, '2017-12-09'::DATE, 610, 3300, 200, 2750, 3150),
//                 (949, '2018-02-11'::DATE, 570, 3250, 180, 2725, 3125),
//                 (950, '2018-05-22'::DATE, 510, 3100, 160, 2700, 3100),
//                 (951, '2015-03-12'::DATE, 780, 3600, 270, 2850, 3250),
//                 (952, '2015-07-10'::DATE, 720, 3500, 240, 2825, 3225),
//                 (953, '2015-10-25'::DATE, 670, 3400, 210, 2800, 3200),
//                 (954, '2021-01-01'::DATE, 820, 3700, 290, 2900, 3300),
//                 (955, '2022-01-01'::DATE, 860, 3800, 320, 2925, 3325),
//                 (956, '2019-07-31'::DATE, 700, 3450, 230, 2775, 3175),
//                 (957, '2019-09-11'::DATE, 670, 3400, 210, 2750, 3150),
//                 (958, '2019-10-28'::DATE, 650, 3350, 190, 2725, 3125),
//                 (959, '2019-12-06'::DATE, 620, 3300, 170, 2700, 3100),
//                 (960, '2020-01-25'::DATE, 590, 3250, 150, 2675, 3075),
//                 (961, '2020-03-07'::DATE, 560, 3200, 130, 2650, 3050),
//                 (962, '2020-04-05'::DATE, 540, 3150, 110, 2625, 3025),
//                 (963, '2021-04-18'::DATE, 830, 3700, 300, 2900, 3300),
//                 (964, '2021-05-06'::DATE, 810, 3675, 290, 2875, 3275),
//                 (965, '2021-05-27'::DATE, 790, 3650, 280, 2850, 3250),
//                 (966, '2021-06-27'::DATE, 760, 3625, 260, 2825, 3225),
//                 (967, '2016-06-06'::DATE, 790, 3650, 280, 2850, 3250),
//                 (968, '2021-02-17'::DATE, 810, 3675, 290, 2875, 3275),
//                 (969, '2021-03-19'::DATE, 790, 3650, 280, 2850, 3250),
//                 (970, '2021-04-18'::DATE, 780, 3625, 270, 2825, 3225),
//                 (971, '2021-05-18'::DATE, 760, 3600, 250, 2800, 3200),
//                 (972, '2021-06-17'::DATE, 740, 3575, 230, 2775, 3175),
//                 (973, '2021-07-17'::DATE, 720, 3550, 210, 2750, 3150),
//                 (974, '2022-04-20'::DATE, 840, 3725, 310, 2925, 3325),
//                 (975, '2022-05-20'::DATE, 820, 3700, 300, 2900, 3300),
//                 (976, '2022-06-20'::DATE, 800, 3675, 290, 2875, 3275),
//                 (977, '2022-07-20'::DATE, 780, 3650, 280, 2850, 3250),
//                 (978, '2019-09-19'::DATE, 710, 3475, 240, 2800, 3200),
//                 (979, '2019-10-31'::DATE, 680, 3400, 210, 2775, 3175),
//                 (980, '2019-12-22'::DATE, 650, 3350, 180, 2750, 3150),
//                 (981, '2020-02-08'::DATE, 620, 3300, 150, 2725, 3125),
//                 (982, '2020-04-06'::DATE, 580, 3200, 120, 2675, 3075),
//                 (983, '2023-03-01'::DATE, 870, 3825, 330, 2950, 3350),
//                 (984, '2023-04-12'::DATE, 850, 3800, 320, 2925, 3325),
//                 (985, '2023-05-29'::DATE, 830, 3775, 310, 2900, 3300)
//         ) AS well_data (wellid, first_prod, initial_oil, initial_gas, initial_water, initial_tubpres, initial_caspres),
//         generate_series(CAST('2017-07-01' AS DATE), CAST('2024-09-30' AS DATE), INTERVAL '1 day') AS proddate
//         WHERE first_prod <= proddate;
//     END IF;
// END $$;
// `,
// /* sql */`
// -- Create index for quicker SQL queries
// CREATE INDEX ON production.daily (wellid, proddate);
// `,
// /* sql */`
// CREATE OR REPLACE VIEW production.well_list AS
//     SELECT LW.locationid wellid, LW.locname well_name, LW.facility wellpadid, LP.locname well_pad_name
//     from locations LW
//     join (select locationid, locname from locations where loctypeid='WPD') LP on LP.locationid = CAST(LW.facility as INT)
//     where LW.loctypeid = 'WEL'
// `
]

export default sqlStatements