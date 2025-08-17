"use client"
import React, { useEffect, useState } from "react";
import Container from '@cloudscape-design/components/container';
// import S3ResourceSelector from "@cloudscape-design/components/s3-resource-selector";
// import FileUpload from "@cloudscape-design/components/file-upload";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

import styles from './page.module.css'
// import './page.module.css'

import { remove } from 'aws-amplify/storage';
// import { it } from "node:test";
// import { useAuthenticator } from '@aws-amplify/ui-react';
// import { redirect } from 'next/navigation';

import { withAuth } from '@/components/WithAuth';
import { S3Asset, onFetchObjects } from "@/utils/amplify-utils";

// import { StorageManager } from '@aws-amplify/ui-react-storage';
import { FileUploader } from '@aws-amplify/ui-react-storage';

import '@aws-amplify/ui-react/styles.css';

const addSlashIfDefined = (path: string): string => {
  if (!path) return path;
  return path.endsWith('/') ? path : path + '/';
};

const formatFileSize = (bytes: number | undefined): string => {
  if (bytes === undefined) return '';
  return bytes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

function Page() {
  // const PAGE_SIZE = 20;
  // const [resource, setResource] = React.useState({ uri: "" });
  const [s3PathSegments, setS3PathSegments] = React.useState<string[]>(["production-agent/"])
  const [uploadedFileKeys, setUploadedFileKeys] = React.useState<string[]>([])
  const [additionalS3PrefixSegment, setAdditionalS3PrefixSegment] = React.useState("")
  const [s3Assets, setS3Assets] = useState<S3Asset[]>([]);

  useEffect(() => {
    onFetchObjects(s3PathSegments.join("")).then((objects) => {
      setS3Assets([...objects]);
    });
  }, [s3PathSegments, uploadedFileKeys]);

  const onRemoveObject = async (key: string) => {
    //Create an alert to confirm the user wants to delete the file
    if (!window.confirm(`Are you sure you want to delete ${key}?`)) return;

    try {
      // Delete the object from s3
      await remove({ path: key });
      // Remove the object from the local state
      setS3Assets(s3Assets.filter((obj) => obj.Key !== key));
    } catch (error) {
      console.error('Error removing S3 object:', error);
    }
  }

  const displayFolderOrObject: React.FC<{ item: S3Asset }> = ({ item }) => {
    console.log(item.Key)
    const pathPrefix = s3PathSegments.join("")
    if (item.IsFolder) {
      return (
        <button key={item.Key}
          onClick={() => setS3PathSegments([...s3PathSegments, item.Key])}>
          <span className={styles['icon']}>📁</span>ƒ
          {item.Key}
        </button>
      )
    } else {
      return <a href={`/files/${item.Key}`} target="_blank">
        <span className={styles['icon']}>📄</span>
        {item.Key.substring(pathPrefix.length)}
      </a>
    }
  }

  return (
    <>
      <Container>
        <FormField
          label="View Files"
        >
          {/* <b>{s3PathSegments}</b> */}

          <ul
            className={styles['horizontal-list']}
          >
            {
              s3PathSegments.map((item, index) => (
                <li key={index} className={styles['horizontal-list-item']}
                  onClick={() => setS3PathSegments(s3PathSegments.slice(0, index + 1))}>
                  {item}
                </li>
              ))
            }
          </ul>

          <table className={styles['custom-table']}>
            <thead>
              <tr>
                <th>Name (click to open)</th>
                <th style={{ textAlign: 'right', paddingRight: '16px' }}>Size</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {s3Assets.map((item, index) => (
                <tr key={index}>
                  <td>{displayFolderOrObject({ item })}</td>
                  <td style={{ textAlign: 'right', paddingRight: '16px' }}>{formatFileSize(item.Size)}</td>
                  <td>
                    {!item.IsFolder ?
                      <button onClick={() => onRemoveObject(item.Key)}>Remove File</button>
                      : ""}

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </FormField>
      </Container>
      <Container>
        <FormField label="Upload files">
          <Input
            onChange={({ detail }) => setAdditionalS3PrefixSegment(detail.value)}
            value={additionalS3PrefixSegment}
            placeholder="Optional: Name of folder"
          />
        </FormField>
        <FileUploader
          acceptedFileTypes={['*']}
          path={s3PathSegments.join("") + addSlashIfDefined(additionalS3PrefixSegment)}
          maxFileCount={1000}
          isResumable
          onUploadSuccess={({ key }) => {
            if (key) {
              setUploadedFileKeys((previousKeys) => ([
                ...previousKeys,
                key
              ]))
            }
          }}
        />
      </Container>
    </>
  );
}

export default withAuth(Page)