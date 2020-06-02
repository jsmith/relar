import React, { useState, useEffect } from "react";
import { useUserData } from "~/firestore";
import { AlbumCard } from "~/sections/AlbumCard";
import { Album } from "~/types";

export const Albums = () => {
  const userData = useUserData();
  // TODO cache these. Maybe use react-query??
  // Actually yeah let's use react-query
  // Let's do this later though
  const [albums, setAlbums] = useState<Album[]>([]);
  // TODO loading screen
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userData
      .collection("albums")
      .limit(25)
      .get()
      .then((result) => {
        // TODO validation
        const loaded = result.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Album[];
        console.log("Loaded -> ", loaded);
        setAlbums(loaded);

        setTimeout(() => {
          setLoading(false);
        }, 1000);
      });
  }, [userData]);

  return (
    <div className="flex flex-wrap">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
};
