"""
This script loads sample data to postgres database from moma_public_artists.txt and mama_public_artworks.txt file
use this to load data is you don't have tools installed to copy sample data into postgress database
this module relies on connection details stored in .env file

Usage: sampledata_upload.py
"""
import csv

import psycopg2
from psycopg2.extras import execute_batch
import os

from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Loading environment variables stored in .env
load_dotenv()


def load_sampledata_to_rds_atrists():
    """
    Function to load data in postgres table artists from moma_public_artists.txt file
    """
    with psycopg2.connect(user=os.getenv('rds_username'),
                          password=os.getenv('rds_password'),
                          host=os.getenv('rds_endpoint'),
                          port=os.getenv('rds_port'),
                          dbname=os.getenv('rds_db_name')) as conn:
        conn.autocommit = True
        with conn.cursor() as cur:

            # write moma_public_artists.txt to RDS
            cur.execute('''
                        CREATE TABLE artists (
                          artist_id INT PRIMARY KEY, 
                          full_name varchar, 
                          nationality varchar, 
                          gender varchar, 
                          birth_year INT, 
                          death_year INT)
                        ''')

            with open('./SampleData/moma_public_artists.txt', 'r') as f:
                reader = csv.reader(f, delimiter='|')
                all_data = []
                for idx, row in enumerate(reader):
                    logger.info(row)
                    if idx > 0:
                        print(row)

                        row[0] = int(row[0])
                        row[1] = row[1].replace("'", "''")
                        row[2] = row[2].replace("'", "''")
                        row[3] = row[3].replace("'", "''")
                        row[4] = int(row[4]) if row[4] else -1
                        row[5] = int(row[5]) if row[5] else -1
                        all_data.append(row)

                execute_batch(cur,
                    """INSERT INTO artists (artist_id, full_name, nationality, gender, birth_year, death_year) VALUES (%s, %s, %s, %s, %s, %s)""",
                    all_data)



def load_sampledata_to_rds_artworks():
    """
    Function to load data in postgres table artists from moma_public_artists.txt file
    """
    with psycopg2.connect(user=os.getenv('rds_username'),
                          password=os.getenv('rds_password'),
                          host=os.getenv('rds_endpoint'),
                          port=os.getenv('rds_port'),
                          dbname=os.getenv('rds_db_name')) as conn:
        conn.autocommit = True
        with conn.cursor() as cur:

            # write moma_public_artists.txt to RDS
            cur.execute('''
                        CREATE TABLE artworks (
                            artwork_id INT PRIMARY KEY, 
                            title varchar, 
                            artist_id INT, 
                            date INT, 
                            medium varchar, 
                            dimensions varchar,
                            acquisition_date date, 
                            credit varchar, 
                            catalogue varchar, 
                            department varchar,
                            classification varchar, 
                            object_number varchar, 
                            diameter_cm FLOAT, 
                            circumference_cm FLOAT,
                            height_cm FLOAT, 
                            length_cm FLOAT, 
                            width_cm FLOAT, 
                            depth_cm FLOAT, 
                            weight_kg FLOAT,
                            durations INT)
                        ''')

            with open('./SampleData/moma_public_artworks.txt', 'r') as f:
                reader = csv.reader(f, delimiter='|')
                all_data = []
                for idx, row in enumerate(reader):
                    logger.info(row)
                    if idx > 0:
                        print(row)

                        row[0] = int(row[0])
                        row[1] = row[1].replace("'", "''")
                        row[2] = int(row[2]) if row[2] else 0
                        row[3] = int(row[3]) if row[3] else 0
                        row[4] = row[4].replace("'", "''")
                        row[5] = row[5].replace("'", "''")
                        row[6] = row[6] if(row[6]) else '1970-01-01'
                        row[6] = row[6]+'-01' if(len(row[6])==7) else row[6]
                        row[7] = row[7].replace("'", "''")
                        row[8] = row[8].replace("'", "''")
                        row[9] = row[9].replace("'", "''")
                        row[10] = row[10].replace("'", "''")
                        row[11] = row[9].replace("'", "''")
                        row[12] = float(row[12]) if row[12] else 0
                        row[13] = float(row[13]) if row[13] else 0
                        row[14] = float(row[14]) if row[14] else 0
                        row[15] = float(row[15]) if row[15] else 0
                        row[16] = float(row[16]) if row[16] else 0
                        row[17] = float(row[17]) if row[17] else 0
                        row[18] = float(row[18]) if row[18] else 0
                        row[19] = int(row[19]) if row[19] else 0
                        all_data.append(row)

                execute_batch(cur, """INSERT INTO artworks 
                                     (artwork_id, title, artist_id, date, medium, dimensions, acquisition_date, credit, catalogue, department, classification, object_number, diameter_cm, circumference_cm, height_cm, length_cm, width_cm, depth_cm, weight_kg, durations) 
                                   VALUES 
                                     (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                                all_data)


def load_sampledata_to_rds():
    """
    Function to load data in postgres table artists and artworks from moma_public_artists.txt and moma_public_artworks.txt files respectively.
    This function calls load_sampledata_to_rds_atrists() and load_sampledata_to_rds_artworks() functions to load data.
    """
    load_sampledata_to_rds_atrists()
    load_sampledata_to_rds_artworks()


if __name__ == "__main__":
    load_sampledata_to_rds()
