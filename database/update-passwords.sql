USE arbitration_archive;

UPDATE users 
SET password_hash = '$2b$10$lJ3lf9X87SLXx9SSTOOlnOUrCxLeaElAqfSvGl3KaG8PCDGlF/UEe'
WHERE username IN ('admin', 'librarian1', 'user1', 'user2');

SELECT id, username, real_name, role FROM users;
