cat << 'EOF' > commands_handler.js
const OWNER_IDS = new Set([
  '201119815662@c.us',
  '127625724960856@lid',
  '152862986183533@lid'
]);

const BAD_WORDS = ['كلب', 'حمار', 'غبي', 'تافه', 'احا'];
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|chat\.whatsapp\.com\/[^\s]+)/i;

const state = {
  locked: false,
  linkGuard: true,
  badWordGuard: true,
  emojiReact: true,
  muted: new Set()
};

async function resolveTargetId(msg) {
  try {
    const mentions = await msg.getMentions();
    if (mentions && mentions.length > 0 && mentions[0].id && mentions[0].id._serialized) {
      return mentions[0].id._serialized;
    }
  } catch (_) {}

  try {
    if (msg.hasQuotedMsg) {
      const q = await msg.getQuotedMessage();
      if (q) return q.author || q.from || null;
    }
  } catch (_) {}

  return null;
}

function attachAllCommands(client) {
  client.on('message', async (msg) => {
    try {
      if (!msg || typeof msg.body !== 'string') return;
      const body = msg.body.trim();
      if (!body) return;
      const bodyLower = body.toLowerCase();

      const chat = await msg.getChat().catch(() => null);
      const isGroup = Boolean(chat && chat.isGroup);
      const senderId = msg.author || msg.from || '';
      const isOwner = OWNER_IDS.has(senderId) || Boolean(msg.fromMe);

      if (body === '.فتح البوت') {
        if (!isOwner) {
          await msg.reply('⛔ هذا الأمر مخصص للمالك فقط.');
          return;
        }
        state.locked = false;
        await msg.reply('✅ تم فتح البوت وتشغيل جميع الأوامر.');
        return;
      }

      if (body === '.قفل البوت') {
        if (!isOwner) {
          await msg.reply('⛔ هذا الأمر مخصص للمالك فقط.');
          return;
        }
        state.locked = true;
        await msg.reply('🔒 تم قفل البوت مؤقتاً.');
        return;
      }

      if (state.locked && !isOwner) {
        return;
      }

      if (isGroup && state.muted.has(senderId) && !isOwner) {
        await msg.delete(true).catch(() => {});
        return;
      }

      if (isGroup && state.linkGuard && URL_REGEX.test(body) && !isOwner) {
        await msg.delete(true).catch(() => {});
        await chat.sendMessage('🚫 يمنع إرسال الروابط داخل المجموعة.');
        return;
      }

      if (isGroup && state.badWordGuard && BAD_WORDS.some((w) => bodyLower.includes(w)) && !isOwner) {
        await msg.delete(true).catch(() => {});
        await chat.sendMessage('⚠️ تم حذف الرسالة لمخالفتها قوانين المجموعة.');
        return;
      }

      if (body === '.اوامر') {
        await msg.reply([
          '📋 *قائمة الأوامر الكاملة:*',
          '• *.اوامر* — عرض القائمة',
          '• *.حاله* — حالة البوت والإعدادات',
          '• *.بوت* — معلومات البوت',
          '• *.قفل البوت* / *.فتح البوت* — قفل وفتح البوت',
          '• *.منع لينك* / *.اسكت لينك* — حماية الروابط',
          '• *.منع الألفاظ* / *.اسكت الفاظ* — حماية الألفاظ',
          '• *.كتم* / *.رفع* — كتم وفك كتم عضو',
          '• *.الغاء* — تبديل تفاعل 👾',
          '• *.اشتم* / *.جواز* / *.اظهار* / *.عدم استخدام* / *.استرداد*'
        ].join('\n'));
        return;
      }

      if (body === '.حاله') {
        await msg.reply([
          '📊 *حالة البوت:*',
          `• القفل: ${state.locked ? 'مقفول 🔒' : 'مفتوح ✅'}`,
          `• منع الروابط: ${state.linkGuard ? 'مفعل ✅' : 'متوقف ⏸️'}`,
          `• منع الألفاظ: ${state.badWordGuard ? 'مفعل ✅' : 'متوقف ⏸️'}`,
          `• التفاعل 👾: ${state.emojiReact ? 'مفعل ✅' : 'متوقف ⏸️'}`,
          `• المكتومين: ${state.muted.size}`
        ].join('\n'));
        return;
      }

      if (body === '.بوت') {
        await msg.reply('🤖 *معلومات البوت:*\n• الرقم: 201119815662\n• الحالة: يعمل بنجاح ✅');
        return;
      }

      if (body === '.منع لينك') {
        state.linkGuard = true;
        await msg.reply('✅ تم تفعيل منع الروابط.');
        return;
      }

      if (body === '.اسكت لينك') {
        state.linkGuard = false;
        await msg.reply('⏸️ تم إيقاف منع الروابط.');
        return;
      }

      if (body === '.منع الألفاظ') {
        state.badWordGuard = true;
        await msg.reply('✅ تم تفعيل منع الألفاظ.');
        return;
      }

      if (body === '.اسكت الفاظ') {
        state.badWordGuard = false;
        await msg.reply('⏸️ تم إيقاف منع الألفاظ.');
        return;
      }

      if (body === '.الغاء') {
        state.emojiReact = !state.emojiReact;
        await msg.reply(state.emojiReact ? '✅ تم تفعيل التفاعل 👾.' : '⏸️ تم إلغاء التفاعل 👾.');
        return;
      }

      const targetId = await resolveTargetId(msg);

      if (body === '.كتم' || body.startsWith('.كتم ')) {
        if (!targetId) {
          await msg.reply('⚠️ اعمل منشن أو رد على رسالة العضو المراد كتمه.');
          return;
        }
        state.muted.add(targetId);
        await msg.reply('🔇 تم كتم العضو بنجاح.');
        return;
      }

      if (body === '.رفع' || body.startsWith('.رفع ')) {
        if (!targetId) {
          await msg.reply('⚠️ اعمل منشن أو رد على رسالة العضو المراد فك كتمه.');
          return;
        }
        state.muted.delete(targetId);
        await msg.reply('🔊 تم فك الكتم عن العضو بنجاح.');
        return;
      }

      if (body === '.اشتم' || body.startsWith('.اشتم ')) {
        const who = (targetId || senderId || '').split('@')[0] || 'صاحبنا';
        const lines = [
          `😂 يا ${who} محتاج قهوة قبل ما تكتب أي حاجة!`,
          `😏 خف شوية يا ${who}، الكلام ببلاش بس مش بكده!`,
          `🔥 ${who} دخل الجات والهدوء بقى له معنى تاني.`
        ];
        await msg.reply(lines[Math.floor(Math.random() * lines.length)]);
        return;
      }

      if (body === '.جواز' || body.startsWith('.جواز ')) {
        const u1 = (senderId || '').split('@')[0] || 'الطرف الأول';
        const u2 = ((targetId || '201119815662@c.us').split('@')[0]) || 'الطرف الثاني';
        const score = Math.floor(Math.random() * 61) + 40;
        await msg.reply(`💍 *وثيقة جواز*\n• الطرف الأول: @${u1}\n• الطرف الثاني: @${u2}\n• نسبة التوافق: ${score}% ❤️`);
        return;
      }

      if (body === '.اظهار' || body.startsWith('.اظهار ')) {
        const id = targetId || senderId;
        const contact = await client.getContactById(id).catch(() => null);
        const pic = await client.getProfilePicUrl(id).catch(() => null);
        await msg.reply([
          '🪪 *معلومات الحساب:*',
          `• الاسم: ${(contact && (contact.pushname || contact.name)) || 'غير متوفر'}`,
          `• المعرف: ${id || 'غير متوفر'}`,
          `• الصورة: ${pic || 'غير متاحة'}`
        ].join('\n'));
        return;
      }

      if (body === '.عدم استخدام' || body.startsWith('.عدم استخدام ')) {
        await msg.reply('📌 تنبيه: يرجى عدم الاستخدام العشوائي للأوامر.');
        return;
      }

      if (body === '.استرداد' || body.startsWith('.استرداد ')) {
        const id = targetId || senderId;
        const pic = await client.getProfilePicUrl(id).catch(() => null);
        if (pic) {
          await msg.reply(`🖼️ رابط الصورة: ${pic}`);
        } else {
          await msg.reply('⚠️ لا توجد صورة شخصية عامة متاحة لهذا الحساب.');
        }
        return;
      }

      if (state.emojiReact && !body.startsWith('.')) {
        await msg.react('👾').catch(() => {});
      }
    } catch (err) {
      console.error('خطأ في معالج الأوامر:', err);
    }
  });
}

module.exports = { attachAllCommands };
EOF
          
