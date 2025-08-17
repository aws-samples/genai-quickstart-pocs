"use client"
import React, { useState, useEffect } from 'react';

import { getUrl } from 'aws-amplify/storage';

export default function Page({ params }: { params: { s3Key: string[] } }) {
  

  const [selectedFileUrl, setSelectedFileUrl] = useState<URL>();

  useEffect(() => {
    const s3KeyDecoded = params.s3Key.map((item) => decodeURIComponent(item)).join('/')

    console.log('s3 Key: ', s3KeyDecoded)

    getUrl({
      path: s3KeyDecoded,
    }).then((response) => {
      // console.log('response: ', response)
      setSelectedFileUrl(response.url)
      // return response.url
    }
    ).catch((error) => {
      console.error('error: ', error)
    }
    )
  }, [params.s3Key])


  // return <div>My Post: {selectedFileUrl?.toString()}</div>
  return (
    <>
      {/* <div>My Post: {selectedFileUrl?.toString()}</div> */}
      {selectedFileUrl && (
        <iframe
          src={selectedFileUrl?.toString()}
          style={{
            position: 'fixed',
            // height: 100%,
            // width: 100%
            // top: 0,
            // left: 0,
            // width: '100vw',
            // height: '80vh',
            // border: 'none',
            // margin: 0,
            // padding: 0,
          }}
          title="PDF Viewer"
          width="100%"
          height="100%"
          // title="PDF Viewer"
        />)
      }
    </>
  )

}