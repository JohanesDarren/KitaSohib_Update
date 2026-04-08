
/* 
  =============================================================================
  KITASOHIB BACKEND v3.6 - STABLE FORUM & ARTICLE COUNTS
  =============================================================================
*/

var ss = SpreadsheetApp.getActiveSpreadsheet();

// --- UTILS ---

function hashPassword(password) {
  if (!password) return "";
  if (String(password).length === 64 && /^[0-9a-fA-F]+$/.test(String(password))) {
    return String(password);
  }
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password.toString());
  var txtHash = '';
  for (var i = 0; i < rawHash.length; i++) {
    var hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    if (hashVal.toString(16).length == 1) txtHash += '0';
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// --- DATABASE CORE ---

function setupDatabase() {
  const schemas = {
    'users': ['id', 'username', 'email', 'password', 'full_name', 'role', 'school_id', 'school_name', 'status', 'assigned_kader_id', 'avatar_url', 'bio', 'latest_mood', 'is_lead', 'created_at'],
    'schools': ['id', 'school_name', 'address', 'created_at'],
    'chats': ['id', 'sender_id', 'receiver_id', 'message', 'timestamp', 'is_ai', 'referral_id', 'sender_name', 'sender_role', 'is_read'], 
    'referrals': ['id', 'school_id', 'user_id', 'user_name', 'user_avatar', 'kader_id', 'kader_name', 'psychologist_id', 'status', 'notes', 'mood_score', 'created_at', 'updated_at', 'completed_at'],
    'mood_logs': ['id', 'user_id', 'mood_score', 'notes', 'timestamp'],
    'emotion_tests': ['id', 'user_id', 'score', 'level', 'ai_analysis', 'dimension_scores', 'timestamp'],
    'articles': ['id', 'school_id', 'title', 'content', 'image_url', 'category', 'author_id', 'author_name', 'likes_list', 'comments_count', 'created_at'],
    'article_comments': ['id', 'article_id', 'user_id', 'user_name', 'text', 'created_at'],
    'forum_posts': ['id', 'school_id', 'user_id', 'user_name', 'user_avatar', 'user_role', 'content', 'is_anonymous', 'image_url', 'likes_list', 'comments_json', 'created_at'],
    'agendas': ['id', 'school_id', 'title', 'date', 'time', 'location', 'description', 'type', 'author_kader_id', 'participants']
  };

  for (let sheetName in schemas) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(schemas[sheetName]);
      sheet.setFrozenRows(1);
    } else {
      let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      let targetHeaders = schemas[sheetName];
      targetHeaders.forEach(h => {
        if (headers.indexOf(h) === -1) {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
        }
      });
    }
  }
}

// --- DATA ACCESS LAYER ---

function getTable(sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0];
  const rows = values.slice(1);
  
  const jsonCols = ['dimension_scores', 'likes_list', 'comments_json', 'chats', 'participants']; 
  
  return rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (jsonCols.includes(h) && row[i]) {
        try { obj[h] = JSON.parse(row[i]); } catch(e) { obj[h] = []; }
      } else {
        obj[h] = row[i];
      }
    });
    return obj;
  });
}

function createRowInternal(sheetName, data) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) setupDatabase(); 
  
  const currentSheet = ss.getSheetByName(sheetName);
  const headers = currentSheet.getRange(1, 1, 1, currentSheet.getLastColumn()).getValues()[0];
  
  if (!data.id) data.id = String(sheetName.slice(0,3) + '_' + Date.now() + '_' + Math.floor(Math.random()*1000));
  if (!data.created_at) data.created_at = new Date().toISOString();
  
  const row = headers.map(header => {
    let val = data[header];
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return val === undefined ? '' : val;
  });
  
  currentSheet.appendRow(row);
  return data;
}

function updateRowInternal(sheetName, keyColumn, keyValue, updates) {
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyColumn);
  
  if (keyIndex === -1) throw new Error("Key column not found");

  let rowIndex = -1;
  const targetVal = String(keyValue).trim();

  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][keyIndex]).trim() === targetVal) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) throw new Error("ID not found for update");
  
  for (let key in updates) {
    let colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      let val = updates[key];
      if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
      sheet.getRange(rowIndex, colIndex + 1).setValue(val);
    }
  }
  return { id: keyValue, ...updates };
}

// --- SPECIAL HANDLERS ---

function handleForumReply(payload) {
  const { postId, reply } = payload;
  const sheet = ss.getSheetByName('forum_posts');
  if (!sheet) throw new Error("Forum Sheet not found");

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  const commIdx = headers.indexOf('comments_json');
  
  if (idIdx === -1 || commIdx === -1) throw new Error("Invalid schema");

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(postId)) {
      let currentVal = data[i][commIdx];
      let comments = [];
      try {
        comments = currentVal ? JSON.parse(currentVal) : [];
      } catch(e) { 
        comments = []; // Reset if corrupted
      }
      
      comments.push(reply);
      // Force stringify to ensure valid JSON storage
      sheet.getRange(i + 1, commIdx + 1).setValue(JSON.stringify(comments));
      return { success: true };
    }
  }
  throw new Error("Post not found");
}

function handleForumLike(payload) {
  const { postId, userId } = payload;
  const sheet = ss.getSheetByName('forum_posts');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  const likeIdx = headers.indexOf('likes_list');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(postId)) {
      let likes = [];
      try {
        likes = JSON.parse(data[i][likeIdx] || '[]');
      } catch(e) { likes = []; }
      
      const index = likes.indexOf(userId);
      if (index > -1) likes.splice(index, 1);
      else likes.push(userId);
      
      sheet.getRange(i + 1, likeIdx + 1).setValue(JSON.stringify(likes));
      return { success: true, likes };
    }
  }
  throw new Error("Post not found");
}

function handleAddArticleComment(payload) {
  // 1. Add to article_comments sheet
  const comment = createRowInternal('article_comments', payload);
  
  // 2. Update count in articles sheet
  const sheet = ss.getSheetByName('articles');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  const countIdx = headers.indexOf('comments_count');
  
  if (idIdx !== -1 && countIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(payload.article_id)) {
        let currentCount = Number(data[i][countIdx]) || 0;
        sheet.getRange(i + 1, countIdx + 1).setValue(currentCount + 1);
        break;
      }
    }
  }
  return comment;
}

function deleteRowInternal(sheetName, id) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: "Sheet missing" };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, message: "Empty sheet" };
  
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const keyIndex = headers.indexOf('id');
  
  if (keyIndex === -1) return { success: false, message: "ID column missing" };
  
  const targetId = String(id).trim();
  let deleted = false;
  
  for (let i = data.length - 1; i >= 1; i--) {
    const rowId = String(data[i][keyIndex]).trim();
    if (rowId === targetId) {
      sheet.deleteRow(i + 1);
      deleted = true;
      break;
    }
  }
  
  return { success: deleted, id: targetId };
}

function getMessages(u1, u2, referralId) {
  const allChats = getTable('chats');
  return allChats.filter(m => {
    const s = String(m.sender_id);
    const r = String(m.receiver_id);
    const p1 = String(u1);
    const p2 = String(u2);
    const isParticipants = (s === p1 && r === p2) || (s === p2 && r === p1);
    if (referralId && String(referralId) !== 'undefined') {
       return isParticipants && String(m.referral_id) === String(referralId);
    }
    return isParticipants && !m.referral_id; 
  });
}

function getRecentChats(userId) {
  if (!ss.getSheetByName('chats')) setupDatabase();
  const chats = getTable('chats');
  const users = getTable('users');
  const referrals = getTable('referrals');
  
  const relevantIds = new Set();
  const targetId = String(userId);
  
  if (Array.isArray(referrals)) {
    referrals.forEach(r => {
      if (String(r.user_id) === targetId) { relevantIds.add(String(r.kader_id)); relevantIds.add(String(r.psychologist_id)); }
      if (String(r.kader_id) === targetId) relevantIds.add(String(r.user_id));
      if (String(r.psychologist_id) === targetId) relevantIds.add(String(r.user_id));
    });
  }

  if (Array.isArray(chats)) {
    chats.forEach(c => {
      if (String(c.sender_id) === targetId) relevantIds.add(String(c.receiver_id));
      if (String(c.receiver_id) === targetId) relevantIds.add(String(c.sender_id));
    });
  }

  return users.filter(u => relevantIds.has(String(u.id))).map(u => {
    const clean = {...u};
    delete clean.password;
    return clean;
  });
}

function handleLogin(payload) {
  setupDatabase(); 
  const users = getTable('users');
  const inputId = String(payload.email || '').toLowerCase().trim();
  const inputPass = String(payload.password || '').trim();
  
  let user = users.find(u => 
    (String(u.email || '').toLowerCase().trim() === inputId || 
     String(u.username || '').toLowerCase().trim() === inputId)
  );
  
  if (!user && inputId === 'admin@kitasohib.com') {
     const adminData = {
        full_name: "Super Admin",
        email: "admin@kitasohib.com",
        username: "admin_utama",
        password: hashPassword("admin123"), 
        role: "admin",
        status: "active",
        is_lead: true,
        bio: "Administrator Sistem KitaSohib",
        avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=admin",
        created_at: new Date().toISOString()
     };
     createRowInternal('users', adminData);
     const newAdmin = { ...adminData };
     delete newAdmin.password;
     return newAdmin;
  }
  
  if (!user) throw new Error("Email atau Username tidak ditemukan.");
  
  const storedPass = String(user.password || '').trim();
  const hashedInput = hashPassword(inputPass);
  let isPassValid = false;
  
  if (storedPass === hashedInput) isPassValid = true; 
  else if (storedPass === inputPass) { 
    isPassValid = true;
    try { updateRowInternal('users', 'id', user.id, { password: hashedInput }); } catch(e){}
  }
  
  if (!isPassValid) throw new Error("Password salah.");
  
  const cleanUser = { ...user };
  delete cleanUser.password;
  return cleanUser;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  // Increased lock timeout to prevent collision on high concurrency
  if (!lock.tryLock(30000)) return responseJSON({ status: 'error', message: 'Server busy' });
  
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const payload = params.payload;
    let result = null;

    switch (action) {
      case 'login': result = handleLogin(payload); break;
      case 'create_row': 
        if (payload.sheet === 'users' && payload.data.password) payload.data.password = hashPassword(String(payload.data.password).trim());
        result = createRowInternal(payload.sheet, payload.data); 
        break;
      case 'get_table': result = getTable(payload.sheet); break;
      case 'update_row': 
        if (payload.sheet === 'users' && payload.data.password) payload.data.password = hashPassword(String(payload.data.password).trim());
        result = updateRowInternal(payload.sheet, 'id', payload.id, payload.data); 
        break;
      case 'delete_row': result = deleteRowInternal(payload.sheet, payload.id); break;
      case 'get_messages': result = getMessages(payload.user1, payload.user2, payload.referral_id); break;
      case 'get_recent_chats': result = getRecentChats(payload.user_id); break;
      case 'forum_reply': result = handleForumReply(payload); break;
      case 'forum_like': result = handleForumLike(payload); break;
      case 'add_article_comment': result = handleAddArticleComment(payload); break;
      default: return responseJSON({ status: 'error', message: 'Action not found' });
    }
    
    return responseJSON({ status: 'success', data: result });
  } catch (error) {
    return responseJSON({ status: 'error', message: error.toString() });
  } finally { 
    lock.releaseLock(); 
  }
}
