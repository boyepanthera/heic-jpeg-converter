import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import format from "date-fns/format";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { useDropzone } from "react-dropzone";
import "./account.css";
import download from "downloadjs";
import awsExports from "../aws-exports";
Amplify.configure(awsExports);

function Accept(props) {
  const onDrop = useCallback(
    async (acceptedFiles) => {
      props.setFiles([...props.files, ...acceptedFiles]);
      // setMyFiles([...myFiles, ...acceptedFiles]);
      props.setUploading(true);
      let presignurlPromises = [];
      let timestamps = [];

      for (let index = 0; index < acceptedFiles.length; index++) {
        let file = acceptedFiles[index];
        let timestamp = Date.now();
        timestamps[index] = timestamp;
        presignurlPromises[index] = axios.get(
          process.env.REACT_APP_API_BASE_URL +
            "/presign?fileName=" +
            timestamp +
            file.name.trim()
        );
      }

      const presignUrlRes = await Promise.all(presignurlPromises);

      let uploadPromises = presignUrlRes.map((res, index) => {
        return axios({
          method: "PUT",
          url: res.data.fileUploadURL,
          data: acceptedFiles[index],
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      });

      await Promise.all(uploadPromises);
      props.setTimestamps(timestamps);

      props.setUploading(false);
    },
    [props]
  );

  const {
    acceptedFiles,
    fileRejections,
    getRootProps,
    getInputProps,
    inputRef,
  } = useDropzone({
    onDrop,
    maxFiles: 10,
    accept: {
      "image/heic": [".heic"],
    },
  });

  const removeAll = () => {
    acceptedFiles.length = 0;
    acceptedFiles.splice(0, acceptedFiles.length);
    inputRef.current.value = "";
    props.setFiles([]);
    props.setConverted(false);
    return;
  };

  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
      <ul>
        {errors.map((e) => (
          <li key={e.code}>{e.message}</li>
        ))}
      </ul>
    </li>
  ));

  return (
    <section className="container">
      <div {...getRootProps({ className: "dropzone dropzone-wrapper" })}>
        <input multiple {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
        <em>(Only *.heic images will be accepted)</em>
      </div>
      <aside>
        <h4>Accepted files</h4>
        <ul>
          {props.files.map((file) => (
            <li key={file.path}>
              {file.path} - {file.size} bytes
            </li>
          ))}
        </ul>
        <h4>Rejected files</h4>
        <ul>{fileRejectionItems}</ul>
      </aside>
      {props.files.length > 0 && (
        <button disabled={!props.converted} onClick={removeAll}>
          Clear Files
        </button>
      )}
    </section>
  );
}

function Account({ user }) {
  const [files, setFiles] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState([]);

  const handleConvert = async () => {
    setConverting(true);
    let conversionPromises = [];
    for (let index = 0; index < files.length; index++) {
      let file = files[index];
      let timestamp = timestamps[index];
      conversionPromises[index] = axios.put(
        process.env.REACT_APP_API_BASE_URL +
          "/convert?fileName=" +
          timestamp +
          file.name.trim() +
          `&username=${user.username}`
      );
    }

    async function convert() {
      await Promise.allSettled(conversionPromises);
      setConverting(false);
      const { data } = await axios.get(
        process.env.REACT_APP_API_BASE_URL +
          "/gallery?username=" +
          user?.username
      );

      setData(data?.images);
      setConverted(true);
      return;
    }
    convert();
  };

  useEffect(() => {
    async function getData() {
      const { data } = await axios.get(
        process.env.REACT_APP_API_BASE_URL +
          "/gallery?username=" +
          user?.username
      );
      // console.log(data);
      setData(data?.images);
    }
    getData();
  }, [user.username]);

  return (
    <div>
      <Accept
        setUploading={setUploading}
        setFiles={setFiles}
        files={files}
        setTimestamps={setTimestamps}
        converted={converted}
        setConverted={setConverted}
      />
      <button
        onClick={handleConvert}
        disabled={files.length < 1 || uploading || converting || converted}
      >
        {uploading
          ? "Uploading..."
          : converting
          ? "Converting to JPEG..."
          : "Convert to JPEG"}
      </button>
      <FileList
        data={data.sort((a, b) => {
          return b.uploadedAt - a.uploadedAt;
        })}
      />
    </div>
  );
}

export default withAuthenticator(Account);

function FileList({ data }) {
  const downloadFile = async (event, downloadlink) => {
    try {
      const filename = event.target.innerText;
      const res = await fetch(downloadlink);
      const blob = await res.blob();
      download(blob, filename);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <table>
      <thead>
        <tr>
          <td>No.</td>
          <td>Date</td>
          <td>HEIC Filename</td>
          <td>JPEG Filename</td>
          <td>Status</td>
          <td>Download</td>
        </tr>
      </thead>

      <tbody>
        {data.map((item, index) => {
          let dateTime = format(
            new Date(item.uploadedAt),
            "dd-MM-yyyy' T 'HH:mm"
          );
          return (
            <tr key={item.id}>
              <td> {index + 1}</td>
              <td>{dateTime}</td>
              <td>{item.fileName}</td>
              <td>{item.convertedFileName}</td>
              <td>Sucess</td>
              <td>
                <a
                  onClick={async (event) => {
                    event.preventDefault();
                    downloadFile(event, item.downloadLink);
                  }}
                  href={item.downloadLink}
                >
                  {item.convertedFileName}
                </a>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
