import { parseLoveQuestAiAuth } from './lovequest-ai-quota.mjs';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabase-admin.mjs';

const LOG = '[account-delete]';

/**
 * @param {unknown} body
 * @param {Record<string, string | string[] | undefined>} [headers]
 */
export async function deleteAccountPOST(body, headers = {}) {
  const payload = body && typeof body === 'object' ? body : {};
  const confirmation =
    typeof payload.confirmation === 'string' ? payload.confirmation.trim() : '';

  if (confirmation !== 'DELETE') {
    return {
      status: 400,
      json: {
        error: '請輸入 DELETE 以確認刪除帳號',
        code: 'CONFIRMATION_REQUIRED',
      },
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      status: 503,
      json: {
        error: '帳號刪除服務尚未設定，請聯絡客服',
        code: 'SUPABASE_NOT_CONFIGURED',
      },
    };
  }

  const auth = await parseLoveQuestAiAuth(body, headers);
  if (!auth.ok) {
    return { status: auth.status, json: auth.json };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      status: 503,
      json: {
        error: '帳號刪除服務尚未設定，請聯絡客服',
        code: 'SUPABASE_NOT_CONFIGURED',
      },
    };
  }

  const userId = auth.userId;

  try {
    await purgeUserCloudData(admin, userId);

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error(`${LOG} auth.admin.deleteUser failed:`, deleteAuthError.message);
      return {
        status: 500,
        json: {
          error: '無法刪除帳號，請稍後再試或聯絡客服',
          code: 'AUTH_DELETE_FAILED',
        },
      };
    }

    console.log(`${LOG} deleted user ${userId}`);
    return {
      status: 200,
      json: { ok: true, message: '帳號已永久刪除' },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`${LOG} failed:`, msg);
    return {
      status: 500,
      json: {
        error: '刪除帳號時發生錯誤，請稍後再試',
        code: 'DELETE_FAILED',
        detail: msg,
      },
    };
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} userId
 */
async function purgeUserCloudData(admin, userId) {
  await reconcileCouplesBeforeUserDelete(admin, userId);
  await deleteUserScopedRows(admin, userId);
  await deleteLegacyPetRows(admin, userId);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} userId
 */
async function reconcileCouplesBeforeUserDelete(admin, userId) {
  const { data: memberships, error } = await admin
    .from('couple_members')
    .select('couple_id, role')
    .eq('user_id', userId);

  if (error) throw error;

  for (const membership of memberships ?? []) {
    const coupleId = membership.couple_id;
    const { count, error: countErr } = await admin
      .from('couple_members')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', coupleId);

    if (countErr) throw countErr;

    if ((count ?? 0) <= 1) {
      const { error: delErr } = await admin.from('couples').delete().eq('id', coupleId);
      if (delErr) throw delErr;
      console.log(`${LOG} deleted couple ${coupleId} (sole member)`);
      continue;
    }

    if (membership.role === 'owner') {
      const { data: partner, error: partnerErr } = await admin
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', coupleId)
        .neq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (partnerErr) throw partnerErr;

      if (partner?.user_id) {
        const { error: transferErr } = await admin
          .from('couples')
          .update({ owner_id: partner.user_id })
          .eq('id', coupleId);
        if (transferErr) throw transferErr;
        console.log(`${LOG} transferred couple ${coupleId} owner to ${partner.user_id}`);
      }
    }
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} userId
 */
async function deleteUserScopedRows(admin, userId) {
  const tablesWithUserId = [
    'user_ai_favorites',
    'lovequest_ai_daily_usage',
    'user_wallets',
    'user_coin_transactions',
    'user_reward_cards',
    'user_preferences',
    'user_reminders',
    'user_ai_usage',
    'ai_usage_logs',
    'cat_members',
    'cat_invite_codes',
  ];

  for (const table of tablesWithUserId) {
    await deleteWhereEq(admin, table, 'user_id', userId);
  }

  await deleteWhereEq(admin, 'profiles', 'id', userId);

  await deleteWhereEq(admin, 'reward_card_records', 'owner_user_id', userId);
  await deleteWhereEq(admin, 'reward_card_records', 'redeemed_by', userId);
  await deleteWhereEq(admin, 'reward_card_records', 'used_by', userId);
  await deleteWhereEq(admin, 'reward_card_records', 'target_user', userId);

  await deleteWhereEq(admin, 'couple_activity_logs', 'actor_user_id', userId);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} userId
 */
async function deleteLegacyPetRows(admin, userId) {
  const { data: cats, error } = await admin.from('cats').select('id').eq('owner_id', userId);
  if (error) throw error;

  for (const cat of cats ?? []) {
    if (!cat?.id) continue;
    await deleteWhereEq(admin, 'daily_records', 'cat_id', cat.id);
    await deleteWhereEq(admin, 'weight_records', 'cat_id', cat.id);
    await deleteWhereEq(admin, 'monthly_records', 'cat_id', cat.id);
    await deleteWhereEq(admin, 'care_events', 'cat_id', cat.id);
    await deleteWhereEq(admin, 'cat_members', 'cat_id', cat.id);
    await deleteWhereEq(admin, 'cat_invite_codes', 'cat_id', cat.id);
  }

  await deleteWhereEq(admin, 'cats', 'owner_id', userId);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} table
 * @param {string} column
 * @param {string} value
 */
async function deleteWhereEq(admin, table, column, value) {
  const { error } = await admin.from(table).delete().eq(column, value);
  if (!error) return;
  if (error.code === '42P01' || /does not exist/i.test(error.message)) {
    return;
  }
  throw error;
}
