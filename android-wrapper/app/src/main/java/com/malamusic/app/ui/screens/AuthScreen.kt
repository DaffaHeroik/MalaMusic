package com.malamusic.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.malamusic.app.data.repository.MusicRepository
import com.malamusic.app.data.api.MusicApi
import com.malamusic.app.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun AuthScreen(repository: MusicRepository, onBack: () -> Unit, onAuthenticated: () -> Unit, onGoogleLogin: () -> Unit = {}) {
    var register by remember { mutableStateOf(false) }
    var resetMode by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF241126), DarkBackground, Color(0xFF080A10))))) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(Modifier.fillMaxWidth().padding(top = 22.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, "Kembali", tint = TextPrimary) }
                Text("Akun MalaMusic", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            }
            Spacer(Modifier.height(42.dp))
            Icon(Icons.Filled.MusicNote, null, tint = Color(0xFFFF5A8A), modifier = Modifier.size(56.dp))
            Spacer(Modifier.height(12.dp))
            Text(when { resetMode -> "Reset password"; register -> "Buat akun kamu"; else -> "Selamat datang kembali" }, color = TextPrimary, fontSize = 25.sp, fontWeight = FontWeight.Black)
            Spacer(Modifier.height(8.dp))
            Text("Gunakan Gmail untuk menyinkronkan koleksi di semua perangkat.", color = TextSecondary, fontSize = 13.sp)
            Spacer(Modifier.height(28.dp))
            Column(Modifier.fillMaxWidth().background(DarkCard, RoundedCornerShape(22.dp)).padding(20.dp)) {
                if (!register && !resetMode) {
                    OutlinedButton(onClick = onGoogleLogin, modifier = Modifier.fillMaxWidth().height(48.dp), enabled = !busy, shape = RoundedCornerShape(14.dp)) {
                        Text("G", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                        Spacer(Modifier.width(10.dp))
                        Text("Lanjutkan dengan Google", color = TextPrimary, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(Modifier.height(16.dp))
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        HorizontalDivider(Modifier.weight(1f), color = Color.White.copy(alpha = 0.12f))
                        Text("  atau email  ", color = TextMuted, fontSize = 11.sp)
                        HorizontalDivider(Modifier.weight(1f), color = Color.White.copy(alpha = 0.12f))
                    }
                    Spacer(Modifier.height(14.dp))
                }
                if (register && !resetMode) {
                    OutlinedTextField(name, { name = it; error = "" }, Modifier.fillMaxWidth(), label = { Text("Nama") }, singleLine = true)
                    Spacer(Modifier.height(12.dp))
                }
                OutlinedTextField(email, { email = it; error = "" }, Modifier.fillMaxWidth(), label = { Text("Alamat Gmail") }, singleLine = true)
                Spacer(Modifier.height(12.dp))
                if (!resetMode) OutlinedTextField(password, { password = it; error = "" }, Modifier.fillMaxWidth(), label = { Text("Password (minimal 8 karakter)") }, singleLine = true, visualTransformation = PasswordVisualTransformation())
                if (error.isNotBlank()) {
                    Spacer(Modifier.height(10.dp))
                    Text(error, color = Color(0xFFFF8196), fontSize = 12.sp)
                }
                Spacer(Modifier.height(18.dp))
                Button(onClick = {
                    if (email.trim().lowercase().endsWith("@gmail.com").not()) { error = "Gunakan alamat Gmail (@gmail.com)."; return@Button }
                    if (!resetMode && password.length < 8) { error = "Password minimal 8 karakter."; return@Button }
                    if (register && !resetMode && name.isBlank()) { error = "Nama wajib diisi."; return@Button }
                    busy = true; error = ""
                    scope.launch {
                        try {
                            if (resetMode) error = MusicApi.resetPassword(email)
                            else { repository.authenticate(email, password, name, register); onAuthenticated() }
                        } catch (e: Exception) { error = e.message ?: "Permintaan gagal. Coba lagi." }
                        finally { busy = false }
                    }
                }, Modifier.fillMaxWidth().height(50.dp), enabled = !busy, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF477E)), shape = RoundedCornerShape(14.dp)) {
                    if (busy) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                    else Text(if (resetMode) "Kirim link reset" else if (register) "Daftar" else "Login", fontWeight = FontWeight.Bold)
                }
                if (!register && !resetMode) TextButton(onClick = { resetMode = true; error = "" }, Modifier.fillMaxWidth(), enabled = !busy) { Text("Lupa password?", color = TextSecondary) }
                TextButton(onClick = { if (resetMode) resetMode = false else register = !register; error = "" }, Modifier.fillMaxWidth(), enabled = !busy) {
                    Text(when { resetMode -> "Kembali ke login"; register -> "Sudah punya akun? Login"; else -> "Belum punya akun? Daftar" }, color = TextPrimary)
                }
            }
            Spacer(Modifier.height(20.dp))
            Text("Login memakai sistem autentikasi MalaMusic yang sama dengan versi web.", color = TextMuted, fontSize = 11.sp)
        }
    }
}
