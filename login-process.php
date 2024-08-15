<?php
session_start();
require 'dbcon.php';

if(isset($_POST['login_btn'])) {
    $username = mysqli_real_escape_string($con, $_POST['username']);
    $password = mysqli_real_escape_string($con, $_POST['password']);

    $query = "SELECT * FROM users WHERE username='$username'";
    $result = mysqli_query($con, $query);

    if(mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);
        
        if(password_verify($password, $user['password'])) {
            $_SESSION['authenticated'] = true;
            $_SESSION['username'] = $user['username'];
            header('Location: index.php');
            exit(0);
        } else {
            $_SESSION['error'] = "Invalid Password";
            header('Location: login.php');
            exit(0);
        }
    } else {
        $_SESSION['error'] = "No User Found";
        header('Location: login.php');
        exit(0);
    }
} else {
    $_SESSION['error'] = "Unauthorized Access";
    header('Location: login.php');
    exit(0);
}
?>
