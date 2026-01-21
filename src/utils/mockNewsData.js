export const mockNewsData = [
    {
        category: 'IT/Science',
        target: { gender: 'male', ageRange: '20-30' },
        articles: [
            { id: 1, title: 'AI가 바꾸는 미래 개발 환경', summary: 'AI 코딩 어시스턴트의 발전과 전망', thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
            { id: 2, title: '최신 그래픽 카드의 혁명', summary: '게이밍과 연산 성능의 비약적 향상', thumbnail: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
        ]
    },
    {
        category: 'Health/Culture',
        target: { gender: 'female', ageRange: '40-50' },
        articles: [
            { id: 3, title: '집에서 할 수 있는 간단한 요가', summary: '건강을 지키는 10분 스트레칭', thumbnail: 'https://images.unsplash.com/photo-1544367563-121910aa662f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
            { id: 4, title: '이번 주말 추천 전시회', summary: '영감을 주는 예술의 세계', thumbnail: 'https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
        ]
    },
    {
        category: 'General',
        target: { gender: 'any', ageRange: 'any' },
        articles: [
            { id: 5, title: '오늘의 주요 뉴스', summary: '국내외 주요 이슈 정리', thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
            { id: 6, title: '주간 날씨 예보', summary: '이번 주 날씨와 옷차림 추천', thumbnail: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
        ]
    }
];

export const getRecommendedNews = (gender, age) => {
    // Simple logic to find best match
    // age is a number
    let selectedCategory = 'General';

    if (gender === 'male' && age >= 20 && age < 40) {
        selectedCategory = 'IT/Science';
    } else if (gender === 'female' && age >= 30) {
        selectedCategory = 'Health/Culture';
    }

    // Find category or return general
    return mockNewsData.find(d => d.category === selectedCategory) || mockNewsData.find(d => d.category === 'General');
};
