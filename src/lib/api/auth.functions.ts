import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(1).optional(),
        role: z.enum(["user", "seller"]),
        businessName: z.string().min(1).optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Create auth user with confirmed email (no verification needed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName ?? "" },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Kullanıcı oluşturulamadı");
    }

    const userId = authData.user.id;

    // 2. Update profile with full_name if provided
    if (data.fullName) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name: data.fullName })
        .eq("id", userId);

      if (profileError) {
        console.error("Profile update error:", profileError);
      }
    }

    // 3. Assign role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });

    if (roleError) {
      console.error("Role insert error:", roleError);
      // Don't throw here — we can fix roles later
    }

    // 4. If seller, create seller profile
    if (data.role === "seller" && data.businessName) {
      const { error: sellerError } = await supabaseAdmin
        .from("seller_profiles")
        .insert({ id: userId, business_name: data.businessName });

      if (sellerError) {
        console.error("Seller profile insert error:", sellerError);
      }
    }

    return {
      success: true,
      userId,
      message: "Hesabın başarıyla oluşturuldu!",
    };
  });
