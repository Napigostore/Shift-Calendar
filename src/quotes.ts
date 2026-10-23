import { Lang, QuoteCategory } from './types';

export interface Quote {
  text: string;
  author?: string;
}

export const QUOTE_CATEGORIES: { key: QuoteCategory; icon: string; names: Record<Lang, string> }[] = [
  { key: 'motivation', icon: '💪', names: { vi: 'Động viên bản thân', en: 'Self-motivation', zh: '自我激励' } },
  { key: 'proverb', icon: '📜', names: { vi: 'Châm ngôn, tục ngữ', en: 'Proverbs', zh: '格言谚语' } },
  { key: 'famous', icon: '🎓', names: { vi: 'Danh ngôn nổi tiếng', en: 'Famous quotes', zh: '名人名言' } },
  { key: 'funny', icon: '😂', names: { vi: 'Câu nói hài hước', en: 'Funny', zh: '幽默语录' } },
];

const Q: Record<Lang, Record<QuoteCategory, Quote[]>> = {
  vi: {
    motivation: [
      { text: 'Mỗi ca làm hôm nay là một viên gạch cho ngôi nhà mơ ước ngày mai.' },
      { text: 'Bạn không cần nhanh, chỉ cần không dừng lại.' },
      { text: 'Ca đêm dài mấy rồi cũng đến bình minh. Cố lên!' },
      { text: 'Mệt thì nghỉ, đừng bỏ cuộc.' },
      { text: 'Người chăm chỉ không bao giờ thiếu cơ hội.' },
      { text: 'Hôm nay làm tốt hơn hôm qua một chút là đủ.' },
      { text: 'An toàn là trên hết — về nhà khoẻ mạnh là chiến thắng lớn nhất.' },
      { text: 'Mồ hôi hôm nay là nụ cười của gia đình ngày mai.' },
      { text: 'Bạn mạnh mẽ hơn bạn nghĩ.' },
      { text: 'Kỷ luật là cây cầu nối giữa mục tiêu và thành quả.' },
    ],
    proverb: [
      { text: 'Có công mài sắt, có ngày nên kim.', author: 'Tục ngữ' },
      { text: 'Kiến tha lâu cũng đầy tổ.', author: 'Tục ngữ' },
      { text: 'Tích tiểu thành đại.', author: 'Thành ngữ' },
      { text: 'Muốn ăn thì lăn vào bếp.', author: 'Tục ngữ' },
      { text: 'Thất bại là mẹ thành công.', author: 'Tục ngữ' },
      { text: 'Đi một ngày đàng, học một sàng khôn.', author: 'Tục ngữ' },
      { text: 'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.', author: 'Ca dao' },
      { text: 'Ăn quả nhớ kẻ trồng cây.', author: 'Tục ngữ' },
      { text: 'Chậm mà chắc.', author: 'Thành ngữ' },
      { text: 'Lửa thử vàng, gian nan thử sức.', author: 'Tục ngữ' },
    ],
    famous: [
      { text: 'Không có việc gì khó, chỉ sợ lòng không bền.', author: 'Hồ Chí Minh' },
      { text: 'Hành trình vạn dặm bắt đầu từ một bước chân.', author: 'Lão Tử' },
      { text: 'Thiên tài là 1% cảm hứng và 99% mồ hôi.', author: 'Thomas Edison' },
      { text: 'Học, học nữa, học mãi.', author: 'V. I. Lenin' },
      { text: 'Biết người là trí, biết mình là sáng.', author: 'Lão Tử' },
      { text: 'Chúng ta là những gì ta lặp đi lặp lại mỗi ngày.', author: 'Aristotle' },
      { text: 'Đừng xấu hổ khi không biết, chỉ xấu hổ khi không học.', author: 'Khổng Tử' },
      { text: 'Hạnh phúc không phải là đích đến mà là hành trình.', author: 'Ngạn ngữ phương Tây' },
    ],
    funny: [
      { text: 'Lương chưa về nhưng tinh thần đã về… quê.' },
      { text: 'Ca đêm: lúc cả thế giới ngủ, chỉ có mình và cái máy pha cà phê là thức.' },
      { text: 'Đồng hồ báo thức là người bạn duy nhất mình muốn nghỉ chơi.' },
      { text: 'Tăng ca không làm mình giàu, nhưng làm mình quen mặt bảo vệ.' },
      { text: 'Ngày nghỉ trôi nhanh như lương về tài khoản rồi đi.' },
      { text: 'Mình không lười, mình đang ở chế độ tiết kiệm năng lượng.' },
      { text: 'Thứ Hai đến nhanh như ca trưởng gọi tăng ca.' },
      { text: 'Ước mơ của mình: một tuần có 5 ngày Chủ nhật.' },
    ],
  },
  en: {
    motivation: [
      { text: 'Every shift today is a brick in the home you dream of.' },
      { text: "You don't have to be fast. You just have to keep going." },
      { text: 'Even the longest night shift ends with a sunrise.' },
      { text: 'Rest if you must, but don’t quit.' },
      { text: 'A little better than yesterday is enough.' },
      { text: 'Safety first — getting home healthy is the biggest win.' },
      { text: 'You are stronger than you think.' },
      { text: 'Discipline is the bridge between goals and results.' },
    ],
    proverb: [
      { text: 'Slow and steady wins the race.', author: 'Proverb' },
      { text: 'Rome wasn’t built in a day.', author: 'Proverb' },
      { text: 'Many hands make light work.', author: 'Proverb' },
      { text: 'The early bird catches the worm.', author: 'Proverb' },
      { text: 'Where there’s a will, there’s a way.', author: 'Proverb' },
      { text: 'Practice makes perfect.', author: 'Proverb' },
      { text: 'Little strokes fell great oaks.', author: 'Proverb' },
      { text: 'After the rain comes the sun.', author: 'Proverb' },
    ],
    famous: [
      { text: 'A journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
      { text: 'Genius is one percent inspiration and ninety-nine percent perspiration.', author: 'Thomas Edison' },
      { text: 'We are what we repeatedly do.', author: 'Aristotle' },
      { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
      { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
      { text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle' },
      { text: 'Energy and persistence conquer all things.', author: 'Benjamin Franklin' },
      { text: 'Nothing will work unless you do.', author: 'Maya Angelou' },
    ],
    funny: [
      { text: 'My bed and I have a strong relationship. My alarm clock keeps trying to break us up.' },
      { text: 'Night shift: when it’s just you and the coffee machine against the world.' },
      { text: 'I’m not lazy, I’m in energy-saving mode.' },
      { text: 'Payday is my favourite holiday. It lasts about four minutes.' },
      { text: 'Overtime didn’t make me rich, but security knows me by name now.' },
      { text: 'Weekends go by faster than my paycheck.' },
      { text: 'Dream job: professional napper, night shift.' },
      { text: 'Monday comes faster than a supervisor asking for overtime.' },
    ],
  },
  zh: {
    motivation: [
      { text: '今天的每一班，都是明天理想之家的一块砖。' },
      { text: '不必很快，只要不停下。' },
      { text: '再长的夜班，也会迎来日出。加油！' },
      { text: '累了就休息，但别放弃。' },
      { text: '比昨天进步一点点就够了。' },
      { text: '安全第一，平安回家就是最大的胜利。' },
    ],
    proverb: [
      { text: '只要功夫深，铁杵磨成针。', author: '谚语' },
      { text: '积少成多，聚沙成塔。', author: '成语' },
      { text: '失败是成功之母。', author: '谚语' },
      { text: '一分耕耘，一分收获。', author: '谚语' },
      { text: '众人拾柴火焰高。', author: '谚语' },
      { text: '台上一分钟，台下十年功。', author: '谚语' },
    ],
    famous: [
      { text: '千里之行，始于足下。', author: '老子' },
      { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
      { text: '知人者智，自知者明。', author: '老子' },
      { text: '天才是百分之一的灵感加百分之九十九的汗水。', author: '爱迪生' },
      { text: '我们反复做的事情造就了我们。', author: '亚里士多德' },
      { text: '不积跬步，无以至千里。', author: '荀子' },
    ],
    funny: [
      { text: '工资还没到账，心已经回老家了。' },
      { text: '夜班：全世界都睡了，只有我和咖啡机醒着。' },
      { text: '我不是懒，我是在省电模式。' },
      { text: '加班没让我变富，但保安已经认识我了。' },
      { text: '周末过得比工资花得还快。' },
      { text: '梦想：一周有五个星期天。' },
    ],
  },
};

/** Câu ngẫu nhiên mỗi lần mở app (ổn định trong 1 phiên). */
export function pickQuote(lang: Lang, cats: QuoteCategory[], seed: number): (Quote & { category: QuoteCategory }) | null {
  const pool = (cats.length ? cats : (['motivation'] as QuoteCategory[])).flatMap((cat) => Q[lang][cat].map((q) => ({ ...q, category: cat })));
  if (!pool.length) return null;
  return pool[Math.floor(seed * pool.length) % pool.length];
}
