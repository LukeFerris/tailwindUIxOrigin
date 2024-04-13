import React from "react";

const UISectionPlaceholder = ({ text }) => {
  return (
    <div className="my-8 max-w-7xl px-2 sm:px-6 lg:px-8 py-6 border-2 border-dashed border-gray-400 rounded-lg">
      <p className="text-center text-gray-600 text-lg italic">{text}</p>
    </div>
  );
};

export default UISectionPlaceholder;
