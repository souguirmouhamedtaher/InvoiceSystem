import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { Role } from "src/domain/enums/role.enums";
import { CreateUserDto, CreateSuperAdminDto, UpdateUserDto, UpdateUserRoleDto, SignUpDto } from "../dtos";
import { User } from "src/domain/entities";

@Injectable()
export class UserFactory {
  createSa(createSuperAdminDto: CreateSuperAdminDto) {
    const newUser = new User();

    newUser.firstName = createSuperAdminDto.firstName;
    newUser.lastName = createSuperAdminDto.lastName;
    newUser.phoneNumber = createSuperAdminDto.phone;
    newUser.idNumber = createSuperAdminDto.idNumber;
    newUser.email = createSuperAdminDto.email.toLowerCase();
    newUser.role = createSuperAdminDto.role ;
    newUser.avatar = createSuperAdminDto.avatar;
    newUser.createdAt = new Date();
    newUser.updatedAt = new Date();

    return newUser;
  }


  createUser(createUserDto: CreateUserDto) {
    const newUser = new User();
    newUser.firstName = createUserDto.firstName;
    newUser.lastName = createUserDto.lastName;
    newUser.phoneNumber = createUserDto.phone;
    newUser.birthday = createUserDto.birthday;
    newUser.idNumber = createUserDto.idNumber;
    newUser.email = createUserDto.email.toLowerCase();
    newUser.role = createUserDto.role;
    newUser.avatar = createUserDto.avatar;
    newUser.createdAt = new Date();
    newUser.updatedAt = new Date();

    return newUser;
  }


  createVisitUser(signUpDto: SignUpDto) {
    const newUser = new User();

    newUser.firstName = signUpDto.firstName;
    newUser.lastName = signUpDto.lastName;
    newUser.phoneNumber = signUpDto.phone;
    newUser.avatar = signUpDto.avatar;
    newUser.birthday = signUpDto.birthday;
    newUser.email = signUpDto.email.toLowerCase();
    newUser.password = signUpDto.password;
    newUser.role = [Role.USER];
    newUser.createdAt = new Date();
    newUser.updatedAt = new Date();

    return newUser;
  }
  updateUser(updateUserDto: UpdateUserDto) {
    const updatedUser = new User();

    if (updateUserDto.email) updatedUser.email =updateUserDto.email.toLowerCase();
    if (updateUserDto.firstName) updatedUser.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) updatedUser.lastName = updateUserDto.lastName;
    if (updateUserDto.phone) updatedUser.phoneNumber = updateUserDto.phone;
    if (updateUserDto.birthday) updatedUser.birthday = updateUserDto.birthday;
    if (updateUserDto.idNumber) updatedUser.idNumber = updateUserDto.idNumber;
    if (updateUserDto.avatar) updatedUser.avatar = updateUserDto.avatar;
    updatedUser.updatedAt = new Date();

    return updatedUser;
  }

  // updateUserPassword({ currentPassword, newPassword }: UpdateUserPasswordDto) {
  //   const updatedUser = new User();

  //   if (email) updatedUser.email = email;
  //   if (firstName) updatedUser.firstName = firstName;
  //   if (lastName) updatedUser.lastName = lastName;

  //   updatedUser.updatedAt = new Date();

  //   return updatedUser;
  // }

  updateRoleUser({ role }: UpdateUserRoleDto) {
    const updatedRoleUser = new User();

    updatedRoleUser.role = role;

    return updatedRoleUser;
  }
}