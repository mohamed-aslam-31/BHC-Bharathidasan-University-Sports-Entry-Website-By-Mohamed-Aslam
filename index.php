<?php
session_start();
if (!isset($_SESSION['authenticated'])) {
    $_SESSION['error'] = "Please login to access this page";
    header('Location: login.php');
    exit(0);
}
require 'dbcon.php';
$departmentQuery = "SELECT DISTINCT NAME_OF_THE_PRESENT_CLASS FROM student_details";
$departmentResult = mysqli_query($con, $departmentQuery);
$yearQuery = "SELECT DISTINCT YEAR FROM student_details";
$yearResult = mysqli_query($con, $yearQuery);
$gameQuery = "SELECT DISTINCT NAME_OF_THE_GAME FROM student_details";
$gameResult = mysqli_query($con, $gameQuery);

?>

<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="./index2.css">
    <title>Student CRUD</title>
</head>

<body>

    <div class="aslam">
        <?php include('message.php'); ?>

        <div class="row">
            <div class="col-md-12">
                <div class="card">

                    <div class="card-header grid-aslam">

                        <h4 class="field-1">Student Details

                     

                            <a href="student-create.php" class="btn btn-primary float-end">ADD NEW FORM</a>
                            <a href="#0" onclick="window.print();" class="btn btn-info float-end"
                                style="color:whitesmoke;margin:0px 10px;">PRINT</a>
                                <a href="logout.php" class="btn btn-secondary float-end">LOGOUT</a>
                        </h4>
                        <div class="filter_container field-2">

                            <label for="rollNoFilter" class="form-label">Student Roll Number</label>
                            <input name="rollNoFilter" id="rollNoFilter" type="text" class="form-control"
                                placeholder="Enter the Roll Number" />
                        </div>

                        <div class="filter_content field-3">
                            <label for="nameFilter" class="form-label">Student Name</label>
                            <input name="nameFilter" id="nameFilter" type="text" class="form-control"
                                placeholder="Enter the Student Name" />
                        </div>
                        <div class="filter_content field-4">
                            <label for="nameofthegameFilter" class="form-label">Name of the Game</label>
                            <select name="nameofthegameFilter" id="nameofthegameFilter" class="form-control">
                                <option value="">All Games</option>

                                <?php

                                while ($row = mysqli_fetch_assoc($gameResult)) {
                                    echo "<option value='{$row['NAME_OF_THE_GAME']}'>{$row['NAME_OF_THE_GAME']}</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <div class="filter_content field-5">
                            <label for="genderFilter" class="form-label">Gender</label>
                            <select name="genderFilter" id="genderFilter" class="form-control">
                                <option value="">All Gender</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                            </select>
                        </div>

                        <div class="filter_content field-6">
                            <label for="departmentFilter" class="form-label">Department</label>
                            <select name="departmentFilter" id="departmentFilter" class="form-control">
                                <option value="">All Department</option>

                                <?php

                                while ($row = mysqli_fetch_assoc($departmentResult)) {
                                    echo "<option value='{$row['NAME_OF_THE_PRESENT_CLASS']}'>{$row['NAME_OF_THE_PRESENT_CLASS']}</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <div class="filter_content field-7">
                            <label for="yearFilter" class="form-label">Year</label>
                            <select name="yearFilter" id="yearFilter" class="form-control">
                                <option value="">All Year</option>
                                <?php

                                while ($row = mysqli_fetch_assoc($yearResult)) {
                                    echo "<option value='{$row['YEAR']}'>{$row['YEAR']}</option>";
                                }
                                ?>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table_details">
                        <div class="kkk">


                            <b style="color:rgb(21, 13, 135);">NUMBER OF STUDENT FORM : <p
                                    style="font-weight: 500;display:inline; color:black" id="counttext"></p></b>
                            <b style="color:rgb(21, 13, 135);"> YEAR : <p
                                    style="font-weight: 500;display:inline ; color:black" id="yeartext"></p></b>
                            <b style="color:rgb(21, 13, 135);">DATE : <p
                                    style="font-weight: 500;display:inline ; color:black " id="datetext"></p></b>

                        </div>
                        <div class="kkk">
                            <b style="color:rgb(21, 13, 135);">NAME OF THE GAME : <p
                                    style="font-weight: 500;display:inline; color:black " id="gametext"></p> </b>
                            <b style="color:rgb(21, 13, 135);">GENDER : <p
                                    style="font-weight: 500;display:inline ; color:black" id="gendertext"></p> </b>
                            <b style="color:rgb(21, 13, 135);">DEPARTMENT : <p
                                    style="font-weight: 500;display:inline; color:black " id="departmenttext"></p></b>


                        </div>

                    </div>
                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th style="color:rgb(163, 23, 23);">ROLL NUMBER</th>
                                <th style="color:rgb(163, 23, 23);">NAME OF THE GAME</th>
                                <th style="color:rgb(163, 23, 23);">GENDER</th>
                                <th style="color:rgb(163, 23, 23);">NAME OF THE STUDENT</th>
                                <th style="color:rgb(163, 23, 23);">DEPARTMENT</th>
                                <th style="color:rgb(163, 23, 23);">YEAR</th>
                                <th class="noPrint">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                          $query = "SELECT * FROM student_details WHERE NOT status='pending' ORDER BY SAVED_TIME DESC";

                            $query_run = mysqli_query($con, $query);

                            if (mysqli_num_rows($query_run) > 0) {
                                foreach ($query_run as $student) {
                                    ?>
                                    <tr>
                                        <td>
                                            <?= $student['ROLL_NO']; ?>
                                        </td>
                                        <td>
                                            <?= $student['NAME_OF_THE_GAME']; ?>
                                        </td>
                                        <td>
                                            <?= $student['GENDER']; ?>
                                        </td>
                                        <td>
                                            <?= $student['NAME_OF_THE_SPORTSPERSON']; ?>
                                        </td>
                                        <td>
                                            <?= $student['NAME_OF_THE_PRESENT_CLASS']; ?>
                                        </td>
                                        <td>
                                            <?= $student['YEAR']; ?>
                                        </td>
                                        <td class="noPrint">
                                            <a href="student-view.php?SAVED_TIME=<?= $student['SAVED_TIME']; ?>"
                                                class="btn btn-info btn-sm" style="color:whitesmoke">PRINT</a>
                                            <a href="student-edit.php?SAVED_TIME=<?= $student['SAVED_TIME']; ?>"
                                                class="btn btn-success btn-sm">EDIT</a>
                                            <form action="code.php" method="POST" class="d-inline">
                                                <button type="submit" name="delete_student"
                                                    value="<?= $student['SAVED_TIME']; ?>"
                                                    class="btn btn-danger btn-sm">DELETE</button>
                                            </form>
                                        </td>
                                    </tr>
                                    <?php
                                }
                            } else {
                                echo "<h5> No Record Found </h5>";
                            }
                            ?>

                        </tbody>
                    </table>

                </div>
            </div>
        </div>
    </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>

        filterTable();

        document.getElementById('rollNoFilter').addEventListener('input', function () {
            filterTable();
        });

        document.getElementById('nameofthegameFilter').addEventListener('change', function () {
            filterTable();
        });

        document.getElementById('genderFilter').addEventListener('change', function () {
            filterTable();
        });

        document.getElementById('nameFilter').addEventListener('input', function () {
            filterTable();
        });

        document.getElementById('departmentFilter').addEventListener('change', function () {
            filterTable();
        });

        document.getElementById('yearFilter').addEventListener('change', function () {
            filterTable();
        });

        function filterTable() {
            var nameFilter = document.getElementById('nameFilter').value.toLowerCase();
            var rollNoFilter = document.getElementById('rollNoFilter').value.toLowerCase();
            var nameofthegameFilter = document.getElementById('nameofthegameFilter').value.toLowerCase();
            var genderFilter = document.getElementById('genderFilter').value.toLowerCase();
            var yearFilter = document.getElementById('yearFilter').value.toLowerCase();
            var departmentFilter = document.getElementById('departmentFilter').value.toLowerCase();

            var rows = document.querySelectorAll('tbody tr');

            var count = 0;

            rows.forEach(function (row) {
                var nameCell = row.cells[3].textContent.toLowerCase();
                var rollNoCell = row.cells[0].textContent.toLowerCase();
                var nameofthegameCell = row.cells[1].textContent.toLowerCase();
                var genderCell = row.cells[2].textContent.toLowerCase();
                var departmentCell = row.cells[4].textContent.toLowerCase();
                var yearCell = row.cells[5].textContent.toLowerCase();

                if (departmentCell.trim() == departmentFilter.trim() || departmentFilter.trim() === '') {
                    row.style.display = '';

                    if (yearCell.trim() === yearFilter.trim() || yearFilter.trim() === '') {
                        row.style.display = '';

                        if (genderFilter.trim() === '' || genderCell.trim() === genderFilter.trim()) {
                            row.style.display = '';

                            if (nameofthegameCell.trim() === nameofthegameFilter.trim() || nameofthegameFilter.trim() === '') {
                                row.style.display = '';

                                if (nameCell.includes(nameFilter) || nameCell === '') {
                                    row.style.display = '';
                                    if (rollNoCell.includes(rollNoFilter) || rollNoFilter === '') {
                                        row.style.display = '';
                                        count++;
                                    } else {
                                        row.style.display = 'none';
                                    }
                                } else {
                                    row.style.display = 'none';
                                }
                            } else {
                                row.style.display = 'none';
                            }
                        } else {
                            row.style.display = 'none';
                        }
                    } else {
                        row.style.display = 'none';
                    }
                } else {
                    row.style.display = 'none';
                }
            });


            document.getElementById('counttext').textContent = count;

            if (
                rollNoFilter.trim() === '' &&
                nameofthegameFilter.trim() === '' &&
                genderFilter.trim() === '' &&
                nameFilter.trim() === '' &&
                departmentFilter.trim() === '' &&
                yearFilter.trim() === ''
            ) {
                document.getElementById('counttext').textContent = rows.length;
            }


            document.getElementById('gendertext').textContent = genderFilter.trim() === '' ? 'ALL GENDER' : genderFilter.toUpperCase();
            document.getElementById('yeartext').textContent = yearFilter.trim() === '' ? 'ALL YEAR' : yearFilter;
            document.getElementById('gametext').textContent = nameofthegameFilter.trim() === '' ? 'ALL GAMES' : nameofthegameFilter.toUpperCase();
            document.getElementById('departmenttext').textContent = departmentFilter.trim() === '' ? 'ALL DEPARTMENT' : departmentFilter.toUpperCase();
        }
        var today = new Date();


        var year = today.getFullYear();
        var month = today.getMonth() + 1;
        var day = today.getDate();

        var formattedDate = (day < 10 ? '0' : '') + day + ' - ' + (month < 10 ? '0' : '') + month + ' - ' + year;


        document.getElementById('datetext').textContent = formattedDate;
    </script>



</body>

</html>