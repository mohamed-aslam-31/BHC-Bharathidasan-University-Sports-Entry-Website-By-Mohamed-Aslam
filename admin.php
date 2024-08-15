<?php
session_start();
$host = "localhost";
$dbUsername = "root";
$dbPassword = "";
$dbname = "dataentry";

$conn = new mysqli($host, $dbUsername, $dbPassword, $dbname);
if (mysqli_connect_errno()) {
    die('Connect Error(' . mysqli_connect_errno() . ')' . mysqli_connect_error());
}

if (isset($_POST['approve'])) {
    $saved_time = $_POST['saved_time'];
    $update_query = "UPDATE student_details SET status='approved' WHERE SAVED_TIME=?";
    $stmt = $conn->prepare($update_query);
    $stmt->bind_param('s', $saved_time); // 's' for string
    $stmt->execute();
    $_SESSION['message'] = "Student Approved Successfully";
    header("Location: admin.php");
    exit();
}

if (isset($_POST['reject'])) {
    $saved_time = $_POST['saved_time'];
    $delete_query = "DELETE FROM student_details WHERE SAVED_TIME=?";
    $stmt = $conn->prepare($delete_query);
    $stmt->bind_param('s', $saved_time); // 's' for string
    $stmt->execute();
    $_SESSION['message'] = "Student Rejected and Deleted Successfully";
    header("Location: admin.php");
    exit();
}

$query = "SELECT * FROM student_details WHERE status='pending'";
$result = $conn->query($query);
?>

<!DOCTYPE html>
<html>
<head>
    <title>Admin Page</title>
</head>
<body>
    <h1>Admin Page</h1>
    <?php
    if (isset($_SESSION['message'])) {
        echo "<div>" . $_SESSION['message'] . "</div>";
        unset($_SESSION['message']);
    }
    ?>
    <table border="1">
        <thead>
            <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Father's Name</th>
                <th>Date of Birth</th>
                <th>Present Course</th>
                <th>Approve</th>
                <th>Reject</th>
            </tr>
        </thead>
        <tbody>
            <?php while ($row = $result->fetch_assoc()) { ?>
                <tr>
                    <td><?php echo $row['ROLL_NO']; ?></td>
                    <td><?php echo $row['NAME_OF_THE_SPORTSPERSON']; ?></td>
                    <td><?php echo $row['FATHER\'S_NAME']; ?></td>
                    <td><?php echo $row['DATE_OF_BIRTH']; ?></td>
                    <td><?php echo $row['PRESENT_COURSE']; ?></td>
                    <td>
                        <form method="post">
                            <input type="hidden" name="saved_time" value="<?php echo $row['SAVED_TIME']; ?>">
                            <button type="submit" name="approve">Approve</button>
                        </form>
                    </td>
                    <td>
                        <form method="post">
                            <input type="hidden" name="saved_time" value="<?php echo $row['SAVED_TIME']; ?>">
                            <button type="submit" name="reject">Reject</button>
                        </form>
                    </td>
                </tr>
            <?php } ?>
        </tbody>
    </table>
</body>
</html>
