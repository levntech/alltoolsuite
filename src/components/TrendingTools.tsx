
import React from 'react'

const TrendingTools = () => {

  return (
    <>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Replace the below divs with actual trending tools */}
            <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold">Tool 1</h3>
            <p className="text-sm text-gray-600">Description of Tool 1</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold">Tool 2</h3>
            <p className="text-sm text-gray-600">Description of Tool 2</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold">Tool 3</h3>
            <p className="text-sm text-gray-600">Description of Tool 3</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold">Tool 4</h3>
            <p className="text-sm text-gray-600">Description of Tool 4</p>
            </div>
        </div>
        
    </>
  )
}

export default TrendingTools