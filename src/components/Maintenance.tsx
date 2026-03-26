export default function Maintenance() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="text-center px-4">
        <div className="text-6xl mb-4">🔧</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">データ修復中！</h1>
        <p className="text-xl text-gray-600 mb-8">申し訳ございません。</p>
        <p className="text-lg text-gray-600 mb-12">現在、システムのメンテナンスを行っています。</p>
        
        <div className="border-t border-gray-300 pt-8">
          <p className="text-sm text-gray-500">もうしばらくお待ちください...</p>
        </div>
      </div>
    </div>
  );
}
