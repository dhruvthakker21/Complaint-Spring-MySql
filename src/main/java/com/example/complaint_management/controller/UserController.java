package com.example.complaint_management.controller;

import com.example.complaint_management.model.User;
import com.example.complaint_management.services.UserServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://127.0.0.1:5500")
@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserServices service;

    @PostMapping("/register")
    public User saveUserforTable(@RequestBody User user){

        return service.saveUserforTable(user);
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Integer id){
        return service.getUserById(id);
    }

    @GetMapping("/all")
    public List<User> getAllUser(){
        return service.getAllUser();
    }

    @DeleteMapping("/del/{id}")
    public String deleteUserById(@PathVariable Integer id){
        boolean exist=service.checkUserExistence(id);

        if(exist){
            service.deleteUser(id);
            return "User Deleted";
        }
        else
            return "User is Not in Database";
    }

    @PutMapping("/update")
    public User updateByUser(@RequestBody User user){
        return service.updateByUser(user);
    }

    @GetMapping("/search")
    public User getUserByEmail(@RequestParam String email){
        return service.getUserByEmail(email);
    }
}
