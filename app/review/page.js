'use client';

import ReviewCard from '@/components/reviewCard';
import Header2 from '@/components/Header2';

const reviews = [
    { id: 1, author: 'John Doe', cleaningType: "입주청소", usageDate: "2024.01.01", buildingType: "아파트", area: "24", spaceInfo: "방3, 화장실1" },
    { id: 2, author: 'Jane Smith', content: 'I love it!', cleaningType: "이사청소", usageDate: "2024.02.15", buildingType: "빌라", area: "15", spaceInfo: "방2, 화장실1" },
    { id: 3, author: 'Mike Johnson', cleaningType: "입주청소", usageDate: "2024.03.10", buildingType: "오피스텔", area: "20", spaceInfo: "방2, 화장실1" },
];

const ReviewPage = () => {
    return (
        <>
            <Header2 title="리뷰내역" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}} onBack={() => window.history.back()} />
            <div style={{ width: '100%', margin: '0 auto', padding: '1rem', display: 'grid', gap: '30px', padding: '20px', boxShadow: '0px 2px 50px 0px #00000014', backgroundColor: '#f0f0f0' }}>
                {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </div>
        </>
    );
};

export default ReviewPage;