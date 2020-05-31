import React from 'react';
import { Album } from '~/types';
import { useThumbnail } from '~/storage';
import { Thumbnail } from '~/components/Thumbnail';
import { useArtist } from '~/firestore';
import { MdPlayCircleFilled } from 'react-icons/md';

export const AlbumCard = ({ album }: { album: Album }) => {
  const thumbnail = useThumbnail(album);
  const artist = useArtist(album);

  return (
    <div
      className="bg-primary-600 flex flex-col px-3 py-4 rounded-md cursor-pointer relative group"
      tabIndex={0}
    >
      {/* <div className="flex justify-center"> */}
      <Thumbnail className="w-32 h-32" thumbnail={thumbnail} />
      <div
        className="w-32 h-32 absolute hidden group-hover:block group-focus:block bg-black"
        style={{ opacity: 0.1 }}
      />
      <div className="w-32 h-32 absolute hidden group-hover:block group-focus:block flex items-center justify-center">
        <MdPlayCircleFilled className="w-8 h-8" />
      </div>
      {/* </div> */}
      <div className="w-32 truncate mt-2">{album.name}</div>
      <div className="w-32 truncate mt-1 text-xs text-gray-400">
        {artist?.name}
      </div>
    </div>
  );
};
