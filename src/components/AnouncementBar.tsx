import React from 'react'

interface AnouncementBarProps {

}

const AnouncementBar: React.FC <AnouncementBarProps> = ({})=>{
    return (
        <div>
            <div className="announcement-bar bg-amber-700 text-white py-2 px-4 text-center text-sm">
                <span>🚀 New AI Tools added weekly! Check out our latest features. <a
                    className="underline font-semibold hover:text-gray-200" href="#">Learn More</a></span>
                <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl" id="close-announcement">×</button>
            </div>
        </div>
    )
}

export default AnouncementBar
