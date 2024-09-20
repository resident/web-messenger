export default function ProgressBar({className, progress = 0}) {
    return (
        <div className={`w-full bg-gray-200 rounded-full h-1 ${className}`}>
            <div className={`bg-blue-500 h-1 rounded-full`} style={{width: `${progress}%`}}></div>
        </div>
    )
}
