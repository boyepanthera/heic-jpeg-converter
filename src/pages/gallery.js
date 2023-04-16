import axios from "axios";
import React, { useEffect, useState } from "react";
import "./gallery.css";

function Gallery() {
  const [data, setData] = useState([]);
  useEffect(() => {
    async function getData() {
      const { data } = await axios.get(
        "https://bydiqlucdd.execute-api.us-east-1.amazonaws.com/prod/gallery"
      );
      // console.log(data);
      const reducedData = data?.images.slice(0, 9);
      setData(reducedData);
    }
    getData();
  }, []);

  return (
    <>
      <h1>Gallery Page</h1>
      <div className="image-container">
        {data.map((item) => {
          return (
            <div>
              <img
                key={item.id}
                height={"400"}
                width={"400"}
                alt="img"
                src={item.downloadLink}
              />
              <p>{item.convertedFileName}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Gallery;
