import React, { useMemo } from 'react';
import { getRecommendedNews } from '../utils/mockNewsData';
import { Newspaper } from 'lucide-react';

export default function NewsSection({ demographics }) {
    const { gender, age } = demographics;

    const recommendedCategory = useMemo(() => {
        return getRecommendedNews(gender, age);
    }, [gender, age]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <Newspaper className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">맞춤 뉴스</h2>
                <span className="ml-auto text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {gender === 'male' ? '남성' : gender === 'female' ? '여성' : '분석 중'} / {age > 0 ? `${Math.floor(age)}세` : '...'}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {recommendedCategory.articles.map(article => (
                    <div key={article.id} className="bg-gray-800 bg-opacity-50 hover:bg-opacity-100 transition p-3 rounded-lg flex gap-3 border border-gray-700">
                        <img
                            src={article.thumbnail}
                            alt={article.title}
                            className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                        />
                        <div className="flex flex-col justify-between">
                            <h3 className="font-semibold text-gray-100 line-clamp-2 leading-snug">{article.title}</h3>
                            <p className="text-sm text-gray-400 line-clamp-1">{article.summary}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-2 text-xs text-right text-gray-500">
                카테고리: <span className="text-blue-400">{recommendedCategory.category}</span>
            </div>
        </div>
    );
}
