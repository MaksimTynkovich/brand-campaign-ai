import React from 'react';

const videoUrls = [
  'https://cdn.prod.website-files.com/67459e4d11ea8f89122689ca/68e6630cf2bebfaf8ed505a3_3video.webp',
  'https://cdn.prod.website-files.com/67459e4d11ea8f89122689ca/68e6647328fdc175188398f1_4video.webp',
  'https://cdn.prod.website-files.com/67459e4d11ea8f89122689ca/68e6630c6385efed4bdfef33_8video.webp',
];

function VideoCarousel() {
  // Дублируем видео для бесконечной прокрутки
  const duplicatedVideos = [...videoUrls, ...videoUrls, ...videoUrls];

  return (
    <div className="pb-16 bg-white overflow-hidden">
      <div className="relative">
        <div className="flex animate-infinite-scroll carousel-container">
          {duplicatedVideos.map((url, index) => (
            <div
              key={index}
              className="flex-shrink-0 mx-2 w-[280px]"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-lg bg-black aspect-[9/16] hover:shadow-2xl transition-shadow duration-300">
                <img
                  src={url}
                  alt={`Demo video ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VideoCarousel;
