export default function NewsFeed({ news, loading }) {
  if (loading) return (
    <div className="rounded-2xl p-5 bg-[var(--bg-card)] border border-border">
      <div className="skeleton h-5 w-32 mb-4"/>
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 w-full mb-2 rounded-xl"/>)}
    </div>
  );

  if (!news?.length) return null;

  const getSentiment = (title, content) => {
    const text = (title + ' ' + content).toLowerCase();
    const positive = ['growth', 'profit', 'surge', 'gains', 'beats', 'record', 'up', 'rally', 'strong', 'expansion'];
    const negative = ['fall', 'decline', 'loss', 'drops', 'down', 'risk', 'concern', 'weak', 'cut', 'slips'];
    const posScore = positive.filter(w => text.includes(w)).length;
    const negScore = negative.filter(w => text.includes(w)).length;
    if (posScore > negScore) return { label: 'Positive', bg: 'var(--green-dim)', color: 'var(--green)' };
    if (negScore > posScore) return { label: 'Negative', bg: 'var(--red-dim)', color: 'var(--red)' };
    return { label: 'Neutral', bg: 'rgba(248,200,80,0.1)', color: 'var(--amber)' };
  };

  const positiveCount = news.filter(n => getSentiment(n.title, n.content || '').label === 'Positive').length;
  const negativeCount = news.filter(n => getSentiment(n.title, n.content || '').label === 'Negative').length;
  const neutralCount = news.length - positiveCount - negativeCount;
  const sentimentScore = ((positiveCount / news.length) * 100).toFixed(0);

  return (
    <div className="rounded-2xl p-5 bg-[var(--bg-card)] border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">News & Sentiment</h3>
        <span className="text-xs text-[var(--text-tertiary)]">{news.length} articles</span>
      </div>

      {/* Sentiment bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{color:'var(--green)'}}>Positive {positiveCount}</span>
          <span style={{color:'var(--amber)'}}>Neutral {neutralCount}</span>
          <span style={{color:'var(--red)'}}>Negative {negativeCount}</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] flex overflow-hidden gap-0.5">
          <div className="h-full rounded-full transition-all" style={{ width: `${(positiveCount/news.length)*100}%`, background:'var(--green)' }}/>
          <div className="h-full rounded-full transition-all" style={{ width: `${(neutralCount/news.length)*100}%`, background:'var(--amber)' }}/>
          <div className="h-full rounded-full transition-all" style={{ width: `${(negativeCount/news.length)*100}%`, background:'var(--red)' }}/>
        </div>
        <div className="text-xs text-[var(--text-tertiary)] mt-1.5">
          Overall sentiment score: <span style={{color:'var(--green)'}}>{sentimentScore}%</span> positive
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-2">
        {news.map((article, i) => {
          const sent = getSentiment(article.title, article.content || '');
          return (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-all group cursor-pointer border border-transparent hover:border-border"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-[var(--text-primary)] leading-relaxed group-hover:text-white transition-colors line-clamp-2">
                  {article.title}
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium mt-0.5"
                  style={{ background: sent.bg, color: sent.color }}>
                  {sent.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-[var(--text-tertiary)]">{article.source}</span>
                {article.published_date && (
                  <span className="text-[10px] text-[var(--text-tertiary)]">· {article.published_date}</span>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}