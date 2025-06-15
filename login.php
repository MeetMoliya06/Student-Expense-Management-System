<?php
require_once 'config.php';

if (isset($_GET["code"])) {
    $token = $google_client->fetchAccessTokenWithAuthCode($_GET["code"]);
    
    if (!isset($token['error'])) {
        // Set the access token
        $google_client->setAccessToken($token['access_token']);
        $_SESSION['access_token'] = $token['access_token'];

        // Get user information
        $google_service = new Google_Service_Oauth2($google_client);
        $data = $google_service->userinfo->get();
        
        // Extract user information
        $google_id = $data['id'];
        $email = $data['email'];
        $first_name = $data['given_name'];
        $last_name = isset($data['family_name']) ? $data['family_name'] : ''; 
        $profile_picture = $data['picture'];

        // Check if user exists
        $stmt = $conn->prepare("SELECT * FROM users WHERE google_id = ?");
        $stmt->bind_param("s", $google_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            // User exists, update session
            $user = $result->fetch_assoc();
        } else {
            // Insert new user into database
            $stmt = $conn->prepare("INSERT INTO users (google_id, first_name, last_name, email, profile_picture) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssss", $google_id, $first_name, $last_name, $email, $profile_picture);
            $stmt->execute();
            $user = [
                'google_id' => $google_id,
                'first_name' => $first_name,
                'last_name' => $last_name,
                'email' => $email,
                'profile_picture' => $profile_picture,
            ];
        }

        // Save user information in session
        $_SESSION['user_email_address'] = $user['email'];
        $_SESSION['user_first_name'] = $user['first_name'];
        $_SESSION['user_last_name'] = $user['last_name'];
        $_SESSION['user_image'] = $user['profile_picture'];
        // After successful Google login, save the Google ID in session
        $_SESSION['google_id'] = $user['google_id']; // Store the Google ID in the session
        // Redirect to index.php
        header('Location: index.php');
        exit();
    }
}

// If login button is clicked
$login_button = $google_client->createAuthUrl();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login with Google</title>
    <link rel="stylesheet" href="login.css">
</head>
<body>
    <div class="container">
        <div class="login-card">
            <div class="header">
                <h1>Welcome Back</h1>
                <p>Please sign in with Google to continue</p>
            </div>
            <a href="<?php echo $login_button; ?>" class="google-button">
                <!-- Google Sign-in Button -->
                <svg class="google-icon" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
            </a>
        </div>
    </div>
    
    <script>
    // Set Google ID from PHP session to JavaScript sessionStorage
    sessionStorage.setItem('google_id', <?php echo json_encode($_SESSION['google_id']); ?>);
</script>
</body>
</html>