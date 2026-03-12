package com.example.complaint_management.services;

import com.example.complaint_management.model.User;
import com.example.complaint_management.repo.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServices {

    @Autowired
    private UserRepo repo;


    public User saveUserforTable(User user) {
        if(user.getRole()==null){
            user.setRole("USER");
        }
        return repo.save(user);
    }

    public User getUserById(Integer id) {

        return repo.findById(id).orElse(new User());
    }

    public List<User> getAllUsers(String role){

        List<User> users = repo.findAll();

        // jo USER hoy to email hide
        if(!role.equals("ADMIN")){
            users.forEach(user -> user.setEmail(null));
        }

        return users;
    }

    public void deleteUser(Integer id) {
         repo.deleteById(id);
    }

    public boolean checkUserExistence(Integer id) {
        return repo.existsById(id);
    }

    public User updateByUser(User user) {
        //using this pade badho data re-write lakhvo padse or all become null
        //Id is must be in data when we send form post method..
        return repo.save(user);
    }

    public User getUserByEmail(String email) {
        return repo.findByEmail(email);
    }
}
